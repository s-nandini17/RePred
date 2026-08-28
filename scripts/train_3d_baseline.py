import os
import sys
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import GroupKFold
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import Ridge

# Ensure src modules are in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.data.dataset import FireProtDataset
from src.evaluation.metrics import compute_metrics, print_metrics_table

class MeanBaselineRegressor:
    """Trivial baseline that predicts training set mean ddG."""
    def __init__(self):
        self.mean_y = 0.0

    def fit(self, X, y):
        self.mean_y = float(np.mean(y))

    def predict(self, X):
        return np.full(shape=(len(X),), fill_value=self.mean_y, dtype=np.float64)

def run_3d_baseline_benchmark():
    print("==================================================")
    print("  MILESTONE 3C: EXPERIMENTAL WT 3D BASELINE BENCHMARK  ")
    print("==================================================")

    results_dir = "results"
    plots_dir = os.path.join(results_dir, "plots")
    os.makedirs(results_dir, exist_ok=True)
    os.makedirs(plots_dir, exist_ok=True)

    # 1. Load Verified Structural Features
    features_csv_path = os.path.join(results_dir, "structural_features.csv")
    if not os.path.exists(features_csv_path):
        raise FileNotFoundError(f"Structural features CSV missing at {features_csv_path}!")

    df_struct = pd.read_csv(features_csv_path)
    print(f"Loaded verified structural features: {len(df_struct)} records")

    # 2. Join Official Split Labels & Experimental ddG Target by experiment_id
    dataset = FireProtDataset(data_dir="project/data/fireprot/original_copies")
    df_official_comb = dataset.get_split("combined")[['experiment_id', 'split', 'ddG']].drop_duplicates(subset=['experiment_id'])

    # Merge split label and ddG target into df_struct cleanly
    df_merged = pd.merge(df_struct, df_official_comb, on='experiment_id', how='left')

    df_train = df_merged[df_merged['split'] == 'train'].reset_index(drop=True)
    df_val = df_merged[df_merged['split'] == 'val'].reset_index(drop=True)
    df_test = df_merged[df_merged['split'] == 'test'].reset_index(drop=True)

    print("\n--- STEP 1: Official FireProt Split Tracing ---")
    print(f"Train samples:      {len(df_train)}")
    print(f"Validation samples: {len(df_val)}")
    print(f"Test samples:       {len(df_test)}")
    print(f"Total mapped:       {len(df_merged)}")
    assert len(df_train) == 2681, f"Expected 2681 train samples, got {len(df_train)}"
    assert len(df_val) == 402, f"Expected 402 val samples, got {len(df_val)}"
    assert len(df_test) == 350, f"Expected 350 test samples, got {len(df_test)}"

    # 3. Extract 131D Feature Matrices & Target Arrays
    identifier_cols = ['experiment_id', 'uniprot_id', 'pdb_id', 'chain', 'fireprot_position', 'pdb_residue_number', 'insertion_code', 'wild_type', 'mutation', 'split', 'ddG']
    feature_cols = [c for c in df_merged.columns if c not in identifier_cols]
    assert len(feature_cols) == 131, f"Expected 131 feature columns, got {len(feature_cols)}"

    X_train = df_train[feature_cols].values.astype(np.float32)
    y_train = df_train['ddG'].values.astype(np.float64)

    X_val = df_val[feature_cols].values.astype(np.float32)
    y_val = df_val['ddG'].values.astype(np.float64)

    X_test = df_test[feature_cols].values.astype(np.float32)
    y_test = df_test['ddG'].values.astype(np.float64)

    # Preprocessing Leakage Prevention: Fit Scaler strictly on Train
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)

    # 4. Define Candidate Models
    models = {
        "MeanBaseline": (MeanBaselineRegressor(), False),
        "Ridge": (Ridge(alpha=10.0, random_state=42), True),
        "RandomForest": (RandomForestRegressor(n_estimators=150, max_depth=12, min_samples_split=2, min_samples_leaf=1, max_features=1.0, bootstrap=True, random_state=42), False),
        "GradientBoosting": (GradientBoostingRegressor(n_estimators=150, learning_rate=0.05, max_depth=5, min_samples_split=2, min_samples_leaf=1, max_features=1.0, random_state=42), True)
    }

    all_metrics = []
    all_predictions = []

    best_val_model_name = None
    best_val_mae = float("inf")

    print("\n--- STEP 2: Training Downstream Baseline Regressors ---")
    for m_name, (model_inst, use_scaler) in models.items():
        X_tr = X_train_scaled if use_scaler else X_train
        X_va = X_val_scaled if use_scaler else X_val
        X_te = X_test_scaled if use_scaler else X_test

        print(f"\nTraining {m_name} on 131D Experimental WT 3D Features...")
        model_inst.fit(X_tr, y_train)

        pred_tr = model_inst.predict(X_tr)
        pred_va = model_inst.predict(X_va)
        pred_te = model_inst.predict(X_te)

        m_tr = compute_metrics(y_train, pred_tr)
        m_va = compute_metrics(y_val, pred_va)
        m_te = compute_metrics(y_test, pred_te)

        print_metrics_table(m_tr, title=f"3D Structural + {m_name} - TRAIN")
        print_metrics_table(m_va, title=f"3D Structural + {m_name} - VALIDATION")
        print_metrics_table(m_te, title=f"3D Structural + {m_name} - TEST")

        # Model selection on Validation MAE (minimize)
        if m_va['MAE'] < best_val_mae:
            best_val_mae = m_va['MAE']
            best_val_model_name = m_name

        for split_title, df_sp, p_arr, m_dict in [
            ("Train", df_train, pred_tr, m_tr),
            ("Validation", df_val, pred_va, m_va),
            ("Test", df_test, pred_te, m_te)
        ]:
            row = {"model": f"ExperimentalWT3D_{m_name}", "split": split_title}
            row.update(m_dict)
            all_metrics.append(row)

            # Record predictions
            for i_idx, r_sp in df_sp.iterrows():
                all_predictions.append({
                    "experiment_id": r_sp["experiment_id"],
                    "uniprot_id": r_sp["uniprot_id"],
                    "pdb_id": r_sp["pdb_id"],
                    "chain": r_sp["chain"],
                    "position": r_sp["fireprot_position"],
                    "wild_type": r_sp["wild_type"],
                    "mutation": r_sp["mutation"],
                    "split": r_sp["split"],
                    "model": f"ExperimentalWT3D_{m_name}",
                    "experimental_ddG": r_sp["ddG"],
                    "predicted_ddG": float(p_arr[i_idx]),
                    "residual": float(r_sp["ddG"] - p_arr[i_idx])
                })

    # Save Predictions & Metrics
    df_metrics = pd.DataFrame(all_metrics)
    df_metrics.to_csv(os.path.join(results_dir, "3d_baseline_metrics.csv"), index=False)

    df_preds = pd.DataFrame(all_predictions)
    df_preds.to_csv(os.path.join(results_dir, "3d_baseline_predictions.csv"), index=False)

    with open(os.path.join(results_dir, "3d_baseline_metrics.json"), "w") as f:
        json.dump(all_metrics, f, indent=2)

    # 5. Grouped Cross-Protein Robustness Experiment (GroupKFold on Dev Set)
    print("\n--- STEP 3: Executing Grouped 5-Fold Cross-Protein Robustness Experiment ---")
    df_dev = pd.concat([df_train, df_val], ignore_index=True)
    X_dev = df_dev[feature_cols].values.astype(np.float32)
    y_dev = df_dev['ddG'].values.astype(np.float64)
    groups_dev = df_dev['uniprot_id'].values

    gkf = GroupKFold(n_splits=5)
    cv_metrics_list = []

    # Use winning model architecture (RandomForest) for Grouped CV
    for fold, (train_idx, val_idx) in enumerate(gkf.split(X_dev, y_dev, groups=groups_dev)):
        # Verify 0 UniProt overlap
        train_uniprots = set(groups_dev[train_idx])
        val_uniprots = set(groups_dev[val_idx])
        assert len(train_uniprots.intersection(val_uniprots)) == 0, f"Leakage detected in fold {fold+1}!"

        X_f_tr, y_f_tr = X_dev[train_idx], y_dev[train_idx]
        X_f_va, y_f_va = X_dev[val_idx], y_dev[val_idx]

        rf_fold = RandomForestRegressor(n_estimators=150, max_depth=12, min_samples_split=2, min_samples_leaf=1, max_features=1.0, bootstrap=True, random_state=42 + fold)
        rf_fold.fit(X_f_tr, y_f_tr)
        p_f_va = rf_fold.predict(X_f_va)

        m_fold = compute_metrics(y_f_va, p_f_va)
        cv_metrics_list.append(m_fold)

    cv_df = pd.DataFrame(cv_metrics_list)
    cv_mean = cv_df.mean()
    cv_std = cv_df.std()

    print(f"\nGrouped 5-Fold Cross-Protein CV Results (N=3,083, 72 Dev Proteins):")
    print(f"  Mean CV MAE:      {cv_mean['MAE']:.4f} ± {cv_std['MAE']:.4f} kcal/mol")
    print(f"  Mean CV RMSE:     {cv_mean['RMSE']:.4f} ± {cv_std['RMSE']:.4f} kcal/mol")
    print(f"  Mean CV R^2:      {cv_mean['R2']:.4f} ± {cv_std['R2']:.4f}")
    print(f"  Mean CV Pearson:  {cv_mean['Pearson']:.4f} ± {cv_std['Pearson']:.4f}")
    print(f"  Mean CV Spearman: {cv_mean['Spearman']:.4f} ± {cv_std['Spearman']:.4f}")

    # 6. Feature Importances (RandomForest)
    rf_model = models["RandomForest"][0]
    importances = rf_model.feature_importances_
    fi_df = pd.DataFrame({
        "feature_name": feature_cols,
        "importance": importances
    }).sort_values("importance", ascending=False).reset_index(drop=True)

    fi_df.to_csv(os.path.join(results_dir, "3d_feature_importances.csv"), index=False)

    print("\n--- Top 15 Gini Feature Importances (RandomForest) ---")
    for idx, row in fi_df.head(15).iterrows():
        print(f"  {idx+1:2d}. {row['feature_name']:<35} : {row['importance']:.6f}")

    # 7. Diagnostic Plots
    print("\n--- STEP 4: Generating Diagnostic Plots ---")
    rf_test_preds = df_preds[(df_preds['model'] == 'ExperimentalWT3D_RandomForest') & (df_preds['split'] == 'test')]

    # Plot 1: Predicted vs Experimental ddG
    plt.figure(figsize=(7, 6))
    plt.scatter(rf_test_preds['experimental_ddG'], rf_test_preds['predicted_ddG'], alpha=0.6, color='#2b5c8f', edgecolors='none', s=35)
    lims = [-5, 12]
    plt.plot(lims, lims, '--', color='gray', linewidth=1.5, label='Ideal Alignment (y=x)')
    plt.title('Experimental WT 3D (RF) — Test Set: Predicted vs. Experimental ΔΔG', fontsize=11, pad=12)
    plt.xlabel('Experimental ΔΔG (kcal/mol)', fontsize=10)
    plt.ylabel('Predicted ΔΔG (kcal/mol)', fontsize=10)
    plt.xlim(lims)
    plt.ylim(lims)
    plt.grid(True, linestyle=':', alpha=0.6)
    plt.legend(loc='upper left', frameon=True)
    plt.tight_layout()
    plot1_path = os.path.join(plots_dir, "3d_predicted_vs_experimental.png")
    plt.savefig(plot1_path, dpi=300)
    plt.close()
    print(f"Saved plot: {plot1_path}")

    # Plot 2: Residual Distribution
    plt.figure(figsize=(7, 5))
    residuals = rf_test_preds['residual']
    plt.hist(residuals, bins=30, color='#388e3c', edgecolor='black', alpha=0.7)
    plt.axvline(0, color='red', linestyle='--', linewidth=1.5, label='Zero Error')
    plt.title('Experimental WT 3D (RF) — Test Set Residual Distribution', fontsize=11, pad=12)
    plt.xlabel('Residual (Experimental - Predicted ddG in kcal/mol)', fontsize=10)
    plt.ylabel('Frequency', fontsize=10)
    plt.grid(True, linestyle=':', alpha=0.6)
    plt.legend(loc='upper right')
    plt.tight_layout()
    plot2_path = os.path.join(plots_dir, "3d_residual_distribution.png")
    plt.savefig(plot2_path, dpi=300)
    plt.close()
    print(f"Saved plot: {plot2_path}")

    # Plot 3: Top 15 Feature Importances
    plt.figure(figsize=(9, 6))
    top15 = fi_df.head(15).iloc[::-1]
    plt.barh(top15['feature_name'], top15['importance'], color='#8e24aa', alpha=0.85)
    plt.title('Top 15 Structural Feature Importances (RandomForest)', fontsize=11, pad=12)
    plt.xlabel('Gini Importance', fontsize=10)
    plt.grid(True, linestyle=':', alpha=0.6)
    plt.tight_layout()
    plot3_path = os.path.join(plots_dir, "3d_feature_importance.png")
    plt.savefig(plot3_path, dpi=300)
    plt.close()
    print(f"Saved plot: {plot3_path}")

    # 8. Update Representation Comparison Table
    print("\n--- STEP 5: Updating Direct Representation Comparison Table ---")
    comp_csv_path = os.path.join(results_dir, "representation_comparison.csv")
    if os.path.exists(comp_csv_path):
        comp_df = pd.read_csv(comp_csv_path)
    else:
        comp_df = pd.DataFrame()

    new_comp_rows = []
    for m_name in ["Ridge", "RandomForest", "GradientBoosting"]:
        full_m_name = f"ExperimentalWT3D_{m_name}"
        val_m = df_metrics[(df_metrics['model'] == full_m_name) & (df_metrics['split'] == 'Validation')].iloc[0]
        test_m = df_metrics[(df_metrics['model'] == full_m_name) & (df_metrics['split'] == 'Test')].iloc[0]
        new_comp_rows.append({
            "representation": "ExperimentalWT3D_131D",
            "model": m_name,
            "validation_MAE": val_m["MAE"],
            "test_MAE": test_m["MAE"],
            "test_RMSE": test_m["RMSE"],
            "test_R2": test_m["R2"],
            "test_Pearson": test_m["Pearson"],
            "test_Spearman": test_m["Spearman"]
        })

    df_3d_comp = pd.DataFrame(new_comp_rows)
    
    if not comp_df.empty and 'representation' in comp_df.columns:
        comp_df = comp_df[comp_df['representation'] != 'ExperimentalWT3D_131D']
        updated_comp_df = pd.concat([comp_df, df_3d_comp], ignore_index=True)
    else:
        updated_comp_df = df_3d_comp

    updated_comp_df.to_csv(comp_csv_path, index=False)
    print(f"Saved updated representation comparison table to: {comp_csv_path}")

    # 9. Summary Printout
    print("\n==================================================")
    print("  MILESTONE 3C SUMMARY — EXPERIMENTAL WT 3D BASELINE")
    print("==================================================")
    best_3d_val = df_metrics[(df_metrics['model'] == f"ExperimentalWT3D_{best_val_model_name}") & (df_metrics['split'] == 'Validation')].iloc[0]
    best_3d_test = df_metrics[(df_metrics['model'] == f"ExperimentalWT3D_{best_val_model_name}") & (df_metrics['split'] == 'Test')].iloc[0]

    print(f"Selected Model (by Validation MAE): ExperimentalWT3D_{best_val_model_name}")
    print(f"  Val MAE:      {best_3d_val['MAE']:.4f} kcal/mol")
    print(f"  Val RMSE:     {best_3d_val['RMSE']:.4f} kcal/mol")
    print(f"  Val R^2:      {best_3d_val['R2']:.4f}")

    print(f"\nFinal Held-Out Test Evaluation (N=350):")
    print(f"  Test MAE:      {best_3d_test['MAE']:.4f} kcal/mol")
    print(f"  Test RMSE:     {best_3d_test['RMSE']:.4f} kcal/mol")
    print(f"  Test R^2:      {best_3d_test['R2']:.4f}")
    print(f"  Test Pearson:  {best_3d_test['Pearson']:.4f}")
    print(f"  Test Spearman: {best_3d_test['Spearman']:.4f}")

    print("\nComplete Representation Comparison Table:")
    print(updated_comp_df.to_string(index=False))
    print("==================================================")

if __name__ == "__main__":
    run_3d_baseline_benchmark()
