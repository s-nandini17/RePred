import os
import sys
import json
import pandas as pd
import numpy as np
from sklearn.model_selection import GroupKFold, ParameterSampler
from sklearn.ensemble import RandomForestRegressor

# Ensure src modules are in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.data.dataset import FireProtDataset
from src.representations.sequence import SequenceRepresentationExtractor
from src.evaluation.metrics import compute_metrics, print_metrics_table

def run_grouped_cv_rf_tuning():
    print("==================================================")
    print("  GROUPED 5-FOLD CV RANDOM FOREST HYPERPARAMETER TUNING  ")
    print("==================================================")

    results_dir = "results"
    os.makedirs(results_dir, exist_ok=True)

    # 1. Load Data
    dataset = FireProtDataset(data_dir="project/data/fireprot/original_copies")
    df_train = dataset.get_split("train")
    df_val = dataset.get_split("val")
    df_test = dataset.get_split("test")

    # Combine Train (2686) + Val (402) into Development Set (3088)
    df_dev = pd.concat([df_train, df_val], ignore_index=True)
    print(f"Development samples: {len(df_dev)} (Train 2686 + Val 402)")
    print(f"Final Test samples:  {len(df_test)} (STRICTLY UNTOUCHED DURING TUNING)")

    # 2. Extract Features
    extractor = SequenceRepresentationExtractor(context_k=5, ablation_mode=None)
    X_dev = extractor.transform_dataframe(df_dev)
    y_dev = df_dev['ddG'].values.astype(np.float64)
    groups_dev = df_dev['uniprot_id'].values

    X_test = extractor.transform_dataframe(df_test)
    y_test = df_test['ddG'].values.astype(np.float64)

    print(f"X_dev shape:  {X_dev.shape}, y_dev shape:  {y_dev.shape}")
    print(f"X_test shape: {X_test.shape}, y_test shape: {y_test.shape}")
    assert X_dev.shape[1] == 252, f"Expected 252 features, got {X_dev.shape[1]}"

    # 3. Setup 5-Fold GroupKFold & Audit Zero Overlap
    gkf = GroupKFold(n_splits=5)
    folds = list(gkf.split(X_dev, y_dev, groups_dev))

    print(f"\n--- AUDITING 5-FOLD GROUPK-FOLD UNIPROT OVERLAP ---")
    print(f"Total unique UniProt IDs in Dev set: {len(set(groups_dev))}")
    for fold_idx, (tr_idx, val_idx) in enumerate(folds):
        tr_unis = set(groups_dev[tr_idx])
        val_unis = set(groups_dev[val_idx])
        overlap = tr_unis.intersection(val_unis)
        print(f"  Fold {fold_idx+1}: Train UniProts={len(tr_unis)}, Val UniProts={len(val_unis)}, Overlap={len(overlap)}")
        if len(overlap) > 0:
            raise ValueError(f"🚨 FATAL: Fold {fold_idx+1} has {len(overlap)} overlapping UniProt IDs!")
    print("✅ ZERO UNIPROT LEAKAGE CONFIRMED ACROSS ALL 5 FOLDS!")

    # 4. Hyperparameter Search Grid
    param_grid = {
        'n_estimators': [150, 300, 500],
        'max_depth': [4, 6, 8, 10, 12, None],
        'min_samples_split': [2, 5, 10, 20],
        'min_samples_leaf': [1, 2, 5, 10, 20],
        'max_features': [1.0, 'sqrt', 'log2', 0.5]
    }

    # Generate 25 reproducible parameter combinations
    param_samples = list(ParameterSampler(param_grid, n_iter=25, random_state=42))

    print(f"\n--- RUNNING GROUPED 5-FOLD CV ACROSS {len(param_samples)} HYPERPARAMETER CONFIGURATIONS ---")

    cv_results_rows = []
    cv_summary_rows = []

    best_mean_cv_mae = float("inf")
    best_params = None

    for config_idx, params in enumerate(param_samples):
        fold_maes, fold_rmses, fold_r2s, fold_pearsons, fold_spearmans = [], [], [], [], []

        for fold_idx, (tr_idx, val_idx) in enumerate(folds):
            X_tr_f, y_tr_f = X_dev[tr_idx], y_dev[tr_idx]
            X_val_f, y_val_f = X_dev[val_idx], y_dev[val_idx]

            rf = RandomForestRegressor(**params, random_state=42, n_jobs=-1)
            rf.fit(X_tr_f, y_tr_f)
            y_pred_val_f = rf.predict(X_val_f)

            m_f = compute_metrics(y_val_f, y_pred_val_f)
            fold_maes.append(m_f['MAE'])
            fold_rmses.append(m_f['RMSE'])
            fold_r2s.append(m_f['R2'])
            fold_pearsons.append(m_f['Pearson'])
            fold_spearmans.append(m_f['Spearman'])

            # Record per-fold detail
            row_fold = {
                "config_id": config_idx + 1,
                "fold": fold_idx + 1,
                "params_str": json.dumps(params),
                "MAE": m_f['MAE'],
                "RMSE": m_f['RMSE'],
                "R2": m_f['R2'],
                "Pearson": m_f['Pearson'],
                "Spearman": m_f['Spearman']
            }
            cv_results_rows.append(row_fold)

        mean_mae = float(np.mean(fold_maes))
        std_mae = float(np.std(fold_maes))
        mean_rmse = float(np.mean(fold_rmses))
        mean_r2 = float(np.mean(fold_r2s))
        mean_pearson = float(np.mean(fold_pearsons))
        mean_spearman = float(np.mean(fold_spearmans))

        summary_row = {
            "config_id": config_idx + 1,
            "mean_cv_MAE": mean_mae,
            "std_cv_MAE": std_mae,
            "mean_cv_RMSE": mean_rmse,
            "mean_cv_R2": mean_r2,
            "mean_cv_Pearson": mean_pearson,
            "mean_cv_Spearman": mean_spearman,
            "n_estimators": params['n_estimators'],
            "max_depth": str(params['max_depth']),
            "min_samples_split": params['min_samples_split'],
            "min_samples_leaf": params['min_samples_leaf'],
            "max_features": str(params['max_features'])
        }
        cv_summary_rows.append(summary_row)

        print(f"Config {config_idx+1:2d}/25 | MAE: {mean_mae:.4f} ± {std_mae:.4f} | R2: {mean_r2:.4f} | Pearson: {mean_pearson:.4f} | Params: {params}")

        if mean_mae < best_mean_cv_mae:
            best_mean_cv_mae = mean_mae
            best_params = params

    # 5. Save CV Results & Summary
    df_cv_results = pd.DataFrame(cv_results_rows)
    df_cv_results.to_csv(os.path.join(results_dir, "rf_cv_results.csv"), index=False)

    df_cv_summary = pd.DataFrame(cv_summary_rows)
    df_cv_summary = df_cv_summary.sort_values(by="mean_cv_MAE", ascending=True)
    df_cv_summary.to_csv(os.path.join(results_dir, "rf_cv_summary.csv"), index=False)

    # Save Selected Configuration JSON
    tuned_config = {
        "cv_method": "5-fold GroupKFold",
        "grouping_variable": "uniprot_id",
        "primary_selection_metric": "mean_cv_MAE",
        "direction": "minimize",
        "best_mean_cv_MAE": best_mean_cv_mae,
        "best_hyperparameters": best_params,
        "n_dev_samples": len(df_dev),
        "n_test_samples": len(df_test),
        "random_state": 42
    }
    tuned_config_path = os.path.join(results_dir, "rf_tuned_config.json")
    with open(tuned_config_path, "w") as f:
        json.dump(tuned_config, f, indent=2)

    print(f"\n==================================================")
    print(f"  WINNING HYPERPARAMETERS (Lowest Mean CV MAE: {best_mean_cv_mae:.4f})")
    print("==================================================")
    for k, v in best_params.items():
        print(f"  {k:<20}: {v}")

    # 6. Retrain Winning RF Model on ALL 3088 Dev Samples
    print("\n--- STEP 4: Retraining Winning RF Model on ALL 3088 Dev Samples ---")
    best_rf = RandomForestRegressor(**best_params, random_state=42, n_jobs=-1)
    best_rf.fit(X_dev, y_dev)

    # 7. Final Evaluation ONCE on Untouched 350 Test Samples
    print("\n--- STEP 5: Final Unbiased Evaluation on 350 Untouched Test Samples ---")
    y_test_pred = best_rf.predict(X_test)
    test_metrics = compute_metrics(y_test, y_test_pred)

    print_metrics_table(test_metrics, title="TUNED RANDOM FOREST - FINAL TEST EVALUATION")

    # Save Final Tuned Predictions
    df_test_preds = pd.DataFrame({
        "experiment_id": df_test["experiment_id"],
        "protein_name": df_test["protein_name"],
        "uniprot_id": df_test["uniprot_id"],
        "pdb_id_corrected": df_test["pdb_id_corrected"],
        "chain": df_test["chain"],
        "position": df_test["position"],
        "wild_type": df_test["wild_type"],
        "mutation": df_test["mutation"],
        "experimental_ddG": df_test["ddG"],
        "predicted_ddG": y_test_pred,
        "split": "test",
        "model": "Tuned_RandomForest"
    })
    df_test_preds.to_csv(os.path.join(results_dir, "rf_tuned_predictions.csv"), index=False)

    # Save Final Tuned Metrics
    metrics_row = {"model": "Tuned_RandomForest", "split": "test"}
    metrics_row.update(test_metrics)
    df_tuned_metrics = pd.DataFrame([metrics_row])
    df_tuned_metrics.to_csv(os.path.join(results_dir, "rf_tuned_metrics.csv"), index=False)

    # Load Original Baseline RF Test Metrics for Comparison
    df_orig_metrics = pd.read_csv(os.path.join(results_dir, "baseline_metrics.csv"))
    orig_rf_test = df_orig_metrics[(df_orig_metrics['model'] == 'RandomForest') & (df_orig_metrics['split'] == 'Test')].iloc[0]

    print("\n==================================================")
    print("   COMPARISON: ORIGINAL RF vs TUNED RF (TEST SET)   ")
    print("==================================================")
    print(f"Metric          | Original RF Baseline | Tuned RF (GroupKFold)")
    print(f"----------------|----------------------|----------------------")
    print(f"Selection Method| Fixed Baseline       | 5-Fold GroupKFold MAE")
    print(f"Test MAE        | {orig_rf_test['MAE']:.4f} kcal/mol      | {test_metrics['MAE']:.4f} kcal/mol")
    print(f"Test RMSE       | {orig_rf_test['RMSE']:.4f} kcal/mol      | {test_metrics['RMSE']:.4f} kcal/mol")
    print(f"Test R^2        | {orig_rf_test['R2']:.4f}               | {test_metrics['R2']:.4f}")
    print(f"Test Pearson r  | {orig_rf_test['Pearson']:.4f}               | {test_metrics['Pearson']:.4f}")
    print(f"Test Spearman   | {orig_rf_test['Spearman']:.4f}               | {test_metrics['Spearman']:.4f}")
    print("==================================================")

if __name__ == "__main__":
    run_grouped_cv_rf_tuning()
