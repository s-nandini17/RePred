import os
import sys
import json
import torch
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import GroupKFold

# Ensure src modules are in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.data.dataset import FireProtDataset
from src.representations.sequence import SequenceRepresentationExtractor
from src.representations.esm import ESMRepresentationExtractor
from src.evaluation.metrics import compute_metrics, print_metrics_table

def run_controlled_representation_benchmark():
    print("==================================================")
    print("  CONTROLLED REPRESENTATION BENCHMARK (4 PARADIGMS) ")
    print("==================================================")

    results_dir = "results"
    plots_dir = os.path.join(results_dir, "plots")
    os.makedirs(results_dir, exist_ok=True)
    os.makedirs(plots_dir, exist_ok=True)

    # 1. Load Real Data & Mapped Samples
    dataset = FireProtDataset(data_dir="project/data/fireprot/original_copies")
    df_official_comb = dataset.get_split("combined").drop_duplicates(subset=['experiment_id'])

    struct_csv_path = os.path.join(results_dir, "structural_features.csv")
    contact_csv_path = os.path.join(results_dir, "contact_map_features.csv")

    if not os.path.exists(struct_csv_path):
        raise FileNotFoundError(f"Structural features missing at {struct_csv_path}!")
    if not os.path.exists(contact_csv_path):
        raise FileNotFoundError(f"Contact map features missing at {contact_csv_path}!")

    df_struct = pd.read_csv(struct_csv_path)
    df_contact = pd.read_csv(contact_csv_path)
    
    # Merge official split label & target ddG into df_struct cleanly (3,433 mapped samples)
    df_merged = pd.merge(df_struct[['experiment_id']], df_official_comb, on='experiment_id', how='left')

    df_train = df_merged[df_merged['split'] == 'train'].reset_index(drop=True)
    df_val = df_merged[df_merged['split'] == 'val'].reset_index(drop=True)
    df_test = df_merged[df_merged['split'] == 'test'].reset_index(drop=True)
    df_dev = df_merged[df_merged['split'].isin(['train', 'val'])].reset_index(drop=True)

    print("\n--- STEP 1: Official Split & Protein Overlap Audit ---")
    print(f"Mapped Train samples:      {len(df_train)}")
    print(f"Mapped Validation samples: {len(df_val)}")
    print(f"Mapped Test samples:       {len(df_test)}")
    print(f"Total Mapped samples:      {len(df_merged)}")

    train_uniprots = set(df_train['uniprot_id'].dropna().unique())
    val_uniprots = set(df_val['uniprot_id'].dropna().unique())
    test_uniprots = set(df_test['uniprot_id'].dropna().unique())

    overlap_train_val = len(train_uniprots.intersection(val_uniprots))
    overlap_train_test = len(train_uniprots.intersection(test_uniprots))
    overlap_val_test = len(val_uniprots.intersection(test_uniprots))

    print(f"Unique UniProt IDs in Train:      {len(train_uniprots)}")
    print(f"Unique UniProt IDs in Validation: {len(val_uniprots)}")
    print(f"Unique UniProt IDs in Test:       {len(test_uniprots)}")
    print(f"Train ∩ Validation UniProt Overlap: {overlap_train_val}")
    print(f"Train ∩ Test UniProt Overlap:       {overlap_train_test}")
    print(f"Validation ∩ Test UniProt Overlap:  {overlap_val_test}")

    is_protein_held_out = (overlap_train_test == 0) and (overlap_val_test == 0)
    print(f"Official Test Set is Strictly Protein-Held-Out: {is_protein_held_out}")

    # 2. Extract Features for All Four Representations
    print("\n--- STEP 2: Feature Matrix Extraction for All 4 Representations ---")
    
    # A. Hand-Engineered Sequence Representation (252D)
    seq_extractor = SequenceRepresentationExtractor(context_k=5, ablation_mode=None)
    X_seq_train = seq_extractor.transform_dataframe(df_train)
    X_seq_val = seq_extractor.transform_dataframe(df_val)
    X_seq_test = seq_extractor.transform_dataframe(df_test)
    X_seq_dev = seq_extractor.transform_dataframe(df_dev)

    # B. ESM-2 8M Learned Representation (1280D)
    esm_cache_path = os.path.join(results_dir, "esm_embeddings_8m.pt")
    if not os.path.exists(esm_cache_path):
        raise FileNotFoundError(f"ESM cache missing at {esm_cache_path}!")
    
    cache_payload = torch.load(esm_cache_path)
    wt_cache = cache_payload["wt_embeddings"]
    mut_cache = cache_payload["mut_embeddings"]

    def build_esm_features(df):
        features_list = []
        extractor_helper = ESMRepresentationExtractor.__new__(ESMRepresentationExtractor)
        for idx, row in df.iterrows():
            u_id = str(row['uniprot_id']).strip()
            pos = int(row['position'])
            mut = str(row['mutation']).strip()
            wt_item = wt_cache[u_id]
            mut_item = mut_cache[(u_id, pos, mut)]
            feat = extractor_helper.build_mutation_feature_vector(
                wt_token_rep=wt_item["token_rep"],
                mut_token_rep=mut_item["token_rep"],
                wt_mean_emb=wt_item["mean_emb"],
                position=pos
            )
            features_list.append(feat)
        return np.vstack(features_list)

    X_esm_train = build_esm_features(df_train)
    X_esm_val = build_esm_features(df_val)
    X_esm_test = build_esm_features(df_test)
    X_esm_dev = build_esm_features(df_dev)

    # C. Experimental WT 3D Representation (131D)
    identifier_cols_struct = ['experiment_id', 'uniprot_id', 'pdb_id', 'chain', 'fireprot_position', 'pdb_residue_number', 'insertion_code', 'wild_type', 'mutation', 'split', 'ddG']
    struct_feature_cols = [c for c in df_struct.columns if c not in identifier_cols_struct]
    
    df_struct_merged = pd.merge(df_struct, df_official_comb[['experiment_id', 'split', 'ddG']], on='experiment_id', how='left')
    
    X_3d_train = df_struct_merged[df_struct_merged['split'] == 'train'][struct_feature_cols].values.astype(np.float32)
    X_3d_val = df_struct_merged[df_struct_merged['split'] == 'val'][struct_feature_cols].values.astype(np.float32)
    X_3d_test = df_struct_merged[df_struct_merged['split'] == 'test'][struct_feature_cols].values.astype(np.float32)
    X_3d_dev = df_struct_merged[df_struct_merged['split'].isin(['train', 'val'])][struct_feature_cols].values.astype(np.float32)

    # D. Experimental WT Contact Map Representation (107D)
    identifier_cols_contact = ['experiment_id', 'uniprot_id', 'pdb_id', 'chain', 'fireprot_position', 'pdb_residue_number', 'insertion_code', 'wild_type', 'mutation', 'split', 'ddG']
    contact_feature_cols = [c for c in df_contact.columns if c not in identifier_cols_contact]
    
    df_contact_merged = pd.merge(df_contact, df_official_comb[['experiment_id', 'split', 'ddG']], on='experiment_id', how='left')

    X_cmap_train = df_contact_merged[df_contact_merged['split'] == 'train'][contact_feature_cols].values.astype(np.float32)
    X_cmap_val = df_contact_merged[df_contact_merged['split'] == 'val'][contact_feature_cols].values.astype(np.float32)
    X_cmap_test = df_contact_merged[df_contact_merged['split'] == 'test'][contact_feature_cols].values.astype(np.float32)
    X_cmap_dev = df_contact_merged[df_contact_merged['split'].isin(['train', 'val'])][contact_feature_cols].values.astype(np.float32)

    y_train = df_train['ddG'].values.astype(np.float64)
    y_val = df_val['ddG'].values.astype(np.float64)
    y_test = df_test['ddG'].values.astype(np.float64)
    y_dev = df_dev['ddG'].values.astype(np.float64)
    groups_dev = df_dev['uniprot_id'].values

    print(f"Hand-Engineered Sequence Matrix Shape: Train {X_seq_train.shape}, Val {X_seq_val.shape}, Test {X_seq_test.shape}")
    print(f"ESM-2 8M Learned Matrix Shape:       Train {X_esm_train.shape}, Val {X_esm_val.shape}, Test {X_esm_test.shape}")
    print(f"Experimental WT 3D Matrix Shape:       Train {X_3d_train.shape}, Val {X_3d_val.shape}, Test {X_3d_test.shape}")
    print(f"Experimental WT Contact Map Matrix:    Train {X_cmap_train.shape}, Val {X_cmap_val.shape}, Test {X_cmap_test.shape}")

    # 3. Controlled Evaluation on Official Splits using Multi-threaded RandomForest (n_jobs=-1)
    print("\n--- STEP 3: Multi-threaded RandomForest Evaluation on Official Split ---")
    
    rf_params = dict(n_estimators=150, max_depth=12, min_samples_split=2, min_samples_leaf=1, max_features=1.0, bootstrap=True, random_state=42, n_jobs=-1)

    representations_dict = {
        "Hand-Engineered Sequence": (252, X_seq_train, X_seq_val, X_seq_test, X_seq_dev),
        "ESM-2 8M Learned": (1280, X_esm_train, X_esm_val, X_esm_test, X_esm_dev),
        "Experimental WT 3D": (131, X_3d_train, X_3d_val, X_3d_test, X_3d_dev),
        "Experimental WT Contact Map": (107, X_cmap_train, X_cmap_val, X_cmap_test, X_cmap_dev)
    }

    benchmark_rows = []

    for r_name, (dims, X_tr, X_va, X_te, X_d) in representations_dict.items():
        print(f"\nTraining RandomForest (n_jobs=-1) on {r_name} ({dims}D)...")
        rf = RandomForestRegressor(**rf_params)
        rf.fit(X_tr, y_train)

        pred_tr = rf.predict(X_tr)
        pred_va = rf.predict(X_va)
        pred_te = rf.predict(X_te)

        m_tr = compute_metrics(y_train, pred_tr)
        m_va = compute_metrics(y_val, pred_va)
        m_te = compute_metrics(y_test, pred_te)

        print_metrics_table(m_tr, title=f"{r_name} - TRAIN")
        print_metrics_table(m_va, title=f"{r_name} - VALIDATION")
        print_metrics_table(m_te, title=f"{r_name} - TEST")

        benchmark_rows.append({
            "Representation": r_name,
            "Dimensions": dims,
            "Model": "RandomForest",
            "Train_N": len(df_train),
            "Validation_N": len(df_val),
            "Test_N": len(df_test),
            "Validation_MAE": m_va["MAE"],
            "Validation_RMSE": m_va["RMSE"],
            "Validation_R2": m_va["R2"],
            "Validation_Pearson": m_va["Pearson"],
            "Validation_Spearman": m_va["Spearman"],
            "Test_MAE": m_te["MAE"],
            "Test_RMSE": m_te["RMSE"],
            "Test_R2": m_te["R2"],
            "Test_Pearson": m_te["Pearson"],
            "Test_Spearman": m_te["Spearman"]
        })

    df_benchmark = pd.DataFrame(benchmark_rows)
    df_benchmark.to_csv(os.path.join(results_dir, "representation_benchmark.csv"), index=False)
    print(f"\nSaved official representation benchmark to: {os.path.join(results_dir, 'representation_benchmark.csv')}")

    # 4. Grouped 5-Fold Cross-Protein Robustness Benchmark
    print("\n--- STEP 4: Grouped 5-Fold Cross-Protein Robustness Benchmark ---")
    gkf = GroupKFold(n_splits=5)

    grouped_cv_rows = []

    for r_name, (dims, X_tr, X_va, X_te, X_d) in representations_dict.items():
        print(f"\nExecuting Multi-threaded Grouped 5-Fold CV for {r_name} ({dims}D)...")
        fold_metrics = []
        for fold, (f_tr_idx, f_va_idx) in enumerate(gkf.split(X_d, y_dev, groups=groups_dev)):
            assert len(set(groups_dev[f_tr_idx]).intersection(set(groups_dev[f_va_idx]))) == 0

            X_f_tr, y_f_tr = X_d[f_tr_idx], y_dev[f_tr_idx]
            X_f_va, y_f_va = X_d[f_va_idx], y_dev[f_va_idx]

            rf_fold = RandomForestRegressor(n_estimators=150, max_depth=12, min_samples_split=2, min_samples_leaf=1, max_features=1.0, bootstrap=True, random_state=42 + fold, n_jobs=-1)
            rf_fold.fit(X_f_tr, y_f_tr)
            p_f_va = rf_fold.predict(X_f_va)

            m_f = compute_metrics(y_f_va, p_f_va)
            fold_metrics.append(m_f)

        df_f = pd.DataFrame(fold_metrics)
        m_mean = df_f.mean()
        m_std = df_f.std()

        grouped_cv_rows.append({
            "Representation": r_name,
            "Dimensions": dims,
            "Model": "RandomForest",
            "Dev_N": len(df_dev),
            "Groups": len(set(groups_dev)),
            "Folds": 5,
            "CV_MAE_Mean": m_mean["MAE"],
            "CV_MAE_Std": m_std["MAE"],
            "CV_RMSE_Mean": m_mean["RMSE"],
            "CV_RMSE_Std": m_std["RMSE"],
            "CV_R2_Mean": m_mean["R2"],
            "CV_R2_Std": m_std["R2"],
            "CV_Pearson_Mean": m_mean["Pearson"],
            "CV_Pearson_Std": m_std["Pearson"],
            "CV_Spearman_Mean": m_mean["Spearman"],
            "CV_Spearman_Std": m_std["Spearman"]
        })

    df_grouped_cv = pd.DataFrame(grouped_cv_rows)
    df_grouped_cv.to_csv(os.path.join(results_dir, "grouped_cv_comparison.csv"), index=False)
    print(f"Saved grouped CV comparison to: {os.path.join(results_dir, 'grouped_cv_comparison.csv')}")

    # 5. Diagnostic Comparison Visualizations
    print("\n--- STEP 5: Generating Comparison Plots ---")
    
    # Plot 1: Test MAE Comparison (4 Paradigms)
    plt.figure(figsize=(9, 5))
    bars = plt.bar(df_benchmark['Representation'], df_benchmark['Test_MAE'], color=['#1976d2', '#388e3c', '#8e24aa', '#d32f2f'], width=0.5, alpha=0.85)
    plt.title('Representation Benchmark — Held-Out Test Set MAE (Lower is Better)', fontsize=11, pad=12)
    plt.ylabel('Test MAE (kcal/mol)', fontsize=10)
    plt.ylim([1.2, 1.6])
    plt.xticks(rotation=15, ha='right', fontsize=9)
    plt.grid(True, linestyle=':', alpha=0.6, axis='y')
    for bar in bars:
        yval = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2.0, yval + 0.01, f"{yval:.4f}", ha='center', va='bottom', fontweight='bold', fontsize=9)
    plt.tight_layout()
    plot1_path = os.path.join(plots_dir, "representation_mae_comparison.png")
    plt.savefig(plot1_path, dpi=300)
    plt.close()
    print(f"Saved plot: {plot1_path}")

    # Plot 2: Test R2 and Pearson Correlation Comparison (4 Paradigms)
    plt.figure(figsize=(10, 5))
    x = np.arange(len(df_benchmark['Representation']))
    width = 0.35
    plt.bar(x - width/2, df_benchmark['Test_R2'], width, label='Test R^2', color='#f57c00', alpha=0.85)
    plt.bar(x + width/2, df_benchmark['Test_Pearson'], width, label='Test Pearson r', color='#0288d1', alpha=0.85)
    plt.title('Representation Benchmark — Test Set R^2 & Pearson Correlation', fontsize=11, pad=12)
    plt.xticks(x, df_benchmark['Representation'], rotation=15, ha='right', fontsize=9)
    plt.ylabel('Metric Score', fontsize=10)
    plt.ylim([0.0, 0.45])
    plt.grid(True, linestyle=':', alpha=0.6, axis='y')
    plt.legend(loc='upper left', frameon=True)
    plt.tight_layout()
    plot2_path = os.path.join(plots_dir, "representation_r2_pearson_comparison.png")
    plt.savefig(plot2_path, dpi=300)
    plt.close()
    print(f"Saved plot: {plot2_path}")

    # Plot 3: Grouped CV MAE with Error Bars (4 Paradigms)
    plt.figure(figsize=(9, 5))
    plt.errorbar(df_grouped_cv['Representation'], df_grouped_cv['CV_MAE_Mean'], yerr=df_grouped_cv['CV_MAE_Std'], fmt='o', color='#d32f2f', ecolor='#d32f2f', elinewidth=2, capsize=6, markersize=8, label='Grouped 5-Fold CV MAE')
    plt.title('Cross-Protein Robustness Benchmark — Grouped 5-Fold CV MAE (Mean ± SD)', fontsize=11, pad=12)
    plt.xticks(rotation=15, ha='right', fontsize=9)
    plt.ylabel('Mean CV MAE (kcal/mol)', fontsize=10)
    plt.grid(True, linestyle=':', alpha=0.6)
    plt.legend(loc='upper right', frameon=True)
    plt.tight_layout()
    plot3_path = os.path.join(plots_dir, "representation_grouped_cv_comparison.png")
    plt.savefig(plot3_path, dpi=300)
    plt.close()
    print(f"Saved plot: {plot3_path}")

    # 6. Final Benchmark Summary Printout
    print("\n==================================================")
    print("  MILESTONE 5B SUMMARY — CONTROLLED REPRESENTATION BENCHMARK")
    print("==================================================")
    print("\nOFFICIAL HELD-OUT TEST RESULTS (RandomForest, N=350):")
    print(df_benchmark[['Representation', 'Dimensions', 'Validation_MAE', 'Test_MAE', 'Test_RMSE', 'Test_R2', 'Test_Pearson', 'Test_Spearman']].to_string(index=False))

    print("\nGROUPED CROSS-PROTEIN CV RESULTS (5-Fold GroupKFold, N=3,083):")
    print(df_grouped_cv[['Representation', 'Dimensions', 'CV_MAE_Mean', 'CV_MAE_Std', 'CV_R2_Mean', 'CV_Pearson_Mean', 'CV_Spearman_Mean']].to_string(index=False))
    print("==================================================")

if __name__ == "__main__":
    run_controlled_representation_benchmark()
