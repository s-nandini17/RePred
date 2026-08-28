import os
import sys
import json
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
from src.evaluation.metrics import compute_metrics, print_metrics_table

def run_contact_map_baseline():
    print("==================================================")
    print("  MILESTONE 5B — CONTROLLED CONTACT-MAP ΔΔG BENCHMARK  ")
    print("==================================================")

    results_dir = "results"
    plots_dir = os.path.join(results_dir, "plots")
    os.makedirs(results_dir, exist_ok=True)
    os.makedirs(plots_dir, exist_ok=True)

    # 1. Load Verified Contact-Map Features
    features_csv_path = os.path.join(results_dir, "contact_map_features.csv")
    if not os.path.exists(features_csv_path):
        raise FileNotFoundError(f"Contact-Map features CSV missing at {features_csv_path}!")

    df_contact = pd.read_csv(features_csv_path)
    print(f"Loaded verified Contact-Map features: {len(df_contact)} records")

    # 2. Join Official Split Labels & Target ddG by experiment_id
    dataset = FireProtDataset(data_dir="project/data/fireprot/original_copies")
    df_official_comb = dataset.get_split("combined")[['experiment_id', 'split', 'ddG']].drop_duplicates(subset=['experiment_id'])

    df_merged = pd.merge(df_contact, df_official_comb, on='experiment_id', how='left')

    df_train = df_merged[df_merged['split'] == 'train'].reset_index(drop=True)
    df_val = df_merged[df_merged['split'] == 'val'].reset_index(drop=True)
    df_test = df_merged[df_merged['split'] == 'test'].reset_index(drop=True)
    df_dev = df_merged[df_merged['split'].isin(['train', 'val'])].reset_index(drop=True)

    print("\n--- STEP 1: Official FireProt Split Tracing ---")
    print(f"Train samples:      {len(df_train)}")
    print(f"Validation samples: {len(df_val)}")
    print(f"Test samples:       {len(df_test)}")
    print(f"Total mapped:       {len(df_merged)}")
    assert len(df_train) == 2681, f"Expected 2681 train samples, got {len(df_train)}"
    assert len(df_val) == 402, f"Expected 402 val samples, got {len(df_val)}"
    assert len(df_test) == 350, f"Expected 350 test samples, got {len(df_test)}"

    # Check protein overlap
    train_uniprots = set(df_train['uniprot_id'].unique())
    val_uniprots = set(df_val['uniprot_id'].unique())
    test_uniprots = set(df_test['uniprot_id'].unique())

    print(f"Unique UniProt IDs in Train:      {len(train_uniprots)}")
    print(f"Unique UniProt IDs in Validation: {len(val_uniprots)}")
    print(f"Unique UniProt IDs in Test:       {len(test_uniprots)}")
    print(f"Train ∩ Validation Overlap:       {len(train_uniprots.intersection(val_uniprots))}")
    print(f"Train ∩ Test Overlap:             {len(train_uniprots.intersection(test_uniprots))}")
    print(f"Validation ∩ Test Overlap:        {len(val_uniprots.intersection(test_uniprots))}")

    # 3. Extract 107D Feature Matrices
    metadata_cols = ['experiment_id', 'uniprot_id', 'pdb_id', 'chain', 'fireprot_position', 'pdb_residue_number', 'insertion_code', 'wild_type', 'mutation', 'split', 'ddG']
    feature_cols = [c for c in df_merged.columns if c not in metadata_cols]
    assert len(feature_cols) == 107, f"Expected 107 feature columns, got {len(feature_cols)}"

    print(f"Verified feature count: {len(feature_cols)} dimensions")

    X_train = df_train[feature_cols].values.astype(np.float32)
    y_train = df_train['ddG'].values.astype(np.float64)

    X_val = df_val[feature_cols].values.astype(np.float32)
    y_val = df_val['ddG'].values.astype(np.float64)

    X_test = df_test[feature_cols].values.astype(np.float32)
    y_test = df_test['ddG'].values.astype(np.float64)

    X_dev = df_dev[feature_cols].values.astype(np.float32)
    y_dev = df_dev['ddG'].values.astype(np.float64)
    groups_dev = df_dev['uniprot_id'].values

    # 4. Fit Fixed RandomForest Model (n_estimators=150, max_depth=12, random_state=42, n_jobs=-1)
    print("\n--- STEP 2: Training RandomForest Model (107D Contact Map) ---")
    rf = RandomForestRegressor(
        n_estimators=150,
        max_depth=12,
        min_samples_split=2,
        min_samples_leaf=1,
        max_features=1.0,
        bootstrap=True,
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train, y_train)

    pred_train = rf.predict(X_train)
    pred_val = rf.predict(X_val)
    pred_test = rf.predict(X_test)

    m_train = compute_metrics(y_train, pred_train)
    m_val = compute_metrics(y_val, pred_val)
    m_test = compute_metrics(y_test, pred_test)

    print_metrics_table(m_train, title="Contact Map - TRAIN")
    print_metrics_table(m_val, title="Contact Map - VALIDATION")
    print_metrics_table(m_test, title="Contact Map - TEST")

    # 5. Grouped 5-Fold Cross-Protein Robustness CV
    print("\n--- STEP 3: Grouped 5-Fold Cross-Protein Robustness CV ---")
    gkf = GroupKFold(n_splits=5)
    fold_metrics = []

    for fold, (f_tr_idx, f_va_idx) in enumerate(gkf.split(X_dev, y_dev, groups=groups_dev)):
        assert len(set(groups_dev[f_tr_idx]).intersection(set(groups_dev[f_va_idx]))) == 0
        
        X_f_tr, y_f_tr = X_dev[f_tr_idx], y_dev[f_tr_idx]
        X_f_va, y_f_va = X_dev[f_va_idx], y_dev[f_va_idx]

        rf_fold = RandomForestRegressor(
            n_estimators=150,
            max_depth=12,
            min_samples_split=2,
            min_samples_leaf=1,
            max_features=1.0,
            bootstrap=True,
            random_state=42 + fold,
            n_jobs=-1
        )
        rf_fold.fit(X_f_tr, y_f_tr)
        p_f_va = rf_fold.predict(X_f_va)

        m_f = compute_metrics(y_f_va, p_f_va)
        fold_metrics.append(m_f)

    df_f = pd.DataFrame(fold_metrics)
    m_cv_mean = df_f.mean()
    m_cv_std = df_f.std()

    print(f"Grouped 5-Fold CV MAE:     {m_cv_mean['MAE']:.4f} ± {m_cv_std['MAE']:.4f}")
    print(f"Grouped 5-Fold CV RMSE:    {m_cv_mean['RMSE']:.4f} ± {m_cv_std['RMSE']:.4f}")
    print(f"Grouped 5-Fold CV R^2:     {m_cv_mean['R2']:.4f} ± {m_cv_std['R2']:.4f}")
    print(f"Grouped 5-Fold CV Pearson: {m_cv_mean['Pearson']:.4f} ± {m_cv_std['Pearson']:.4f}")

    # 6. Save Predictions CSV
    df_test_preds = df_test[['experiment_id', 'uniprot_id', 'pdb_id', 'mutation', 'split', 'ddG']].copy()
    df_test_preds.rename(columns={'ddG': 'experimental_ddG'}, inplace=True)
    df_test_preds['predicted_ddG'] = pred_test
    df_test_preds['residual'] = pred_test - y_test

    preds_path = os.path.join(results_dir, "contact_map_baseline_predictions.csv")
    df_test_preds.to_csv(preds_path, index=False)
    print(f"\nSaved test predictions to: {preds_path}")

    # 7. Save Metrics JSON & CSV
    metrics_payload = {
        "representation_name": "Experimental WT Contact Map",
        "dimensions": 107,
        "model": "RandomForestRegressor(n_estimators=150, max_depth=12, random_state=42)",
        "train_samples": len(df_train),
        "validation_samples": len(df_val),
        "test_samples": len(df_test),
        "train_metrics": {k: float(v) for k, v in m_train.items()},
        "validation_metrics": {k: float(v) for k, v in m_val.items()},
        "test_metrics": {k: float(v) for k, v in m_test.items()},
        "grouped_5fold_cv": {
            "MAE_mean": float(m_cv_mean["MAE"]), "MAE_std": float(m_cv_std["MAE"]),
            "RMSE_mean": float(m_cv_mean["RMSE"]), "RMSE_std": float(m_cv_std["RMSE"]),
            "R2_mean": float(m_cv_mean["R2"]), "R2_std": float(m_cv_std["R2"]),
            "Pearson_mean": float(m_cv_mean["Pearson"]), "Pearson_std": float(m_cv_std["Pearson"]),
            "Spearman_mean": float(m_cv_mean["Spearman"]), "Spearman_std": float(m_cv_std["Spearman"])
        }
    }

    metrics_json_path = os.path.join(results_dir, "contact_map_baseline_metrics.json")
    with open(metrics_json_path, "w") as f:
        json.dump(metrics_payload, f, indent=2)
    print(f"Saved metrics JSON to: {metrics_json_path}")

    df_metrics_tabular = pd.DataFrame([{
        "Representation": "Experimental WT Contact Map",
        "Dimensions": 107,
        "Model": "RandomForest",
        "Train_MAE": m_train["MAE"], "Train_RMSE": m_train["RMSE"], "Train_R2": m_train["R2"],
        "Val_MAE": m_val["MAE"], "Val_RMSE": m_val["RMSE"], "Val_R2": m_val["R2"],
        "Test_MAE": m_test["MAE"], "Test_RMSE": m_test["RMSE"], "Test_R2": m_test["R2"],
        "Test_Pearson": m_test["Pearson"], "Test_Spearman": m_test["Spearman"],
        "CV_MAE_Mean": m_cv_mean["MAE"], "CV_MAE_Std": m_cv_std["MAE"],
        "CV_R2_Mean": m_cv_mean["R2"], "CV_R2_Std": m_cv_std["R2"]
    }])
    metrics_csv_path = os.path.join(results_dir, "contact_map_baseline_metrics.csv")
    df_metrics_tabular.to_csv(metrics_csv_path, index=False)
    print(f"Saved metrics CSV to: {metrics_csv_path}")

    # 8. Diagnostic Plots
    print("\n--- STEP 4: Generating Diagnostic Plots ---")
    
    # Plot 1: Predicted vs Experimental ddG
    plt.figure(figsize=(7, 6))
    plt.scatter(y_test, pred_test, alpha=0.6, color='#d32f2f', edgecolors='k', linewidths=0.5, s=35, label='Test Samples (N=350)')
    min_val = min(y_test.min(), pred_test.min()) - 0.5
    max_val = max(y_test.max(), pred_test.max()) + 0.5
    plt.plot([min_val, max_val], [min_val, max_val], 'k--', alpha=0.7, label='Ideal Identity')
    plt.title(f'Experimental WT Contact Map — Predicted vs Experimental ΔΔG\nTest MAE={m_test["MAE"]:.4f}, R²={m_test["R2"]:.4f}, Pearson r={m_test["Pearson"]:.4f}', fontsize=10, pad=10)
    plt.xlabel('Experimental ΔΔG (kcal/mol)', fontsize=10)
    plt.ylabel('Predicted ΔΔG (kcal/mol)', fontsize=10)
    plt.grid(True, linestyle=':', alpha=0.6)
    plt.legend(loc='upper left', frameon=True)
    plt.tight_layout()
    p1_path = os.path.join(plots_dir, "contact_map_predicted_vs_experimental.png")
    plt.savefig(p1_path, dpi=300)
    plt.close()
    print(f"Saved plot: {p1_path}")

    # Plot 2: Residual Distribution
    residuals = pred_test - y_test
    plt.figure(figsize=(7, 5))
    plt.hist(residuals, bins=30, color='#d32f2f', alpha=0.75, edgecolor='black', linewidth=0.5)
    plt.axvline(0, color='black', linestyle='--', linewidth=1.2)
    plt.title(f'Contact Map Baseline — Test Set Residual Distribution\nMean={residuals.mean():.4f}, Std={residuals.std():.4f}', fontsize=10, pad=10)
    plt.xlabel('Residual (Predicted - Experimental ΔΔG)', fontsize=10)
    plt.ylabel('Sample Count', fontsize=10)
    plt.grid(True, linestyle=':', alpha=0.6)
    plt.tight_layout()
    p2_path = os.path.join(plots_dir, "contact_map_residual_distribution.png")
    plt.savefig(p2_path, dpi=300)
    plt.close()
    print(f"Saved plot: {p2_path}")

    # Plot 3: Feature Importances Top 15
    importances = rf.feature_importances_
    indices = np.argsort(importances)[::-1][:15]
    top_cols = [feature_cols[i] for i in indices]
    top_imps = importances[indices]

    plt.figure(figsize=(8, 6))
    plt.barh(range(len(top_cols)), top_imps[::-1], color='#d32f2f', alpha=0.85)
    plt.yticks(range(len(top_cols)), top_cols[::-1], fontsize=9)
    plt.xlabel('RandomForest Feature Importance', fontsize=10)
    plt.title('Experimental WT Contact Map — Top 15 Feature Importances', fontsize=11, pad=10)
    plt.grid(True, linestyle=':', alpha=0.6, axis='x')
    plt.tight_layout()
    p3_path = os.path.join(plots_dir, "contact_map_comparison.png")
    plt.savefig(p3_path, dpi=300)
    plt.close()
    print(f"Saved plot: {p3_path}")

if __name__ == "__main__":
    run_contact_map_baseline()
