import os
import sys
import json
import pandas as pd
import numpy as np

# Ensure src modules are in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.data.dataset import FireProtDataset
from src.representations.sequence import SequenceRepresentationExtractor
from src.models.baseline import get_baseline_models
from src.evaluation.metrics import compute_metrics, print_metrics_table

def run_sequence_baseline_benchmark():
    print("==================================================")
    print("  MILESTONE 1: SEQUENCE BASELINE BENCHMARK TRAIN  ")
    print("==================================================")

    results_dir = "results"
    os.makedirs(results_dir, exist_ok=True)

    # 1. Load Data
    print("\n--- STEP 1: Loading Real FireProt Data ---")
    dataset = FireProtDataset(data_dir="project/data/fireprot/original_copies")
    df_train = dataset.get_split("train")
    df_val = dataset.get_split("val")
    df_test = dataset.get_split("test")

    print(f"Loaded Train samples: {len(df_train)}")
    print(f"Loaded Val samples:   {len(df_val)}")
    print(f"Loaded Test samples:  {len(df_test)}")

    # 2. Extract Sequence Features (ablation_mode=None -> 252 features)
    print("\n--- STEP 2: Building Hand-Engineered Sequence/Mutation Features (252 Dims) ---")
    extractor = SequenceRepresentationExtractor(context_k=5, ablation_mode=None)

    X_train = extractor.transform_dataframe(df_train)
    y_train = df_train['ddG'].values.astype(np.float64)

    X_val = extractor.transform_dataframe(df_val)
    y_val = df_val['ddG'].values.astype(np.float64)

    X_test = extractor.transform_dataframe(df_test)
    y_test = df_test['ddG'].values.astype(np.float64)

    print(f"X_train shape: {X_train.shape}, y_train shape: {y_train.shape}")
    print(f"X_val shape:   {X_val.shape}, y_val shape:   {y_val.shape}")
    print(f"X_test shape:  {X_test.shape}, y_test shape:  {y_test.shape}")
    assert X_train.shape[1] == 252, f"Expected 252 features, got {X_train.shape[1]}"

    # Save Sequence Representation Configuration Artifact
    seq_config = {
        "representation_name": "Hand-Engineered Sequence/Mutation Representation",
        "total_feature_dimension": 252,
        "ablation_mode": None,
        "context_k": 5,
        "out_of_range_context_policy": "Out-of-range sequence context is represented by a zero vector to indicate unavailable context.",
        "amino_acid_encoding": "20_dimensional_one_hot",
        "property_features": [
            "BLOSUM62",
            "delta_hydrophobicity",
            "delta_volume",
            "delta_pI",
            "delta_molecular_weight",
            "wild_type_hydrophobicity",
            "mutant_hydrophobicity",
            "wild_type_volume",
            "mutant_volume"
        ],
        "position_features": [
            "absolute_position",
            "sequence_length",
            "relative_position"
        ],
        "context_features": "5_residues_before_and_5_residues_after"
    }
    seq_config_path = os.path.join(results_dir, "sequence_representation_config.json")
    with open(seq_config_path, "w") as f:
        json.dump(seq_config, f, indent=2)
    print(f"Saved representation config artifact to: {seq_config_path}")

    # 3. Fit Models & Evaluate
    # MODEL SELECTION RULE:
    # Primary selection metric: Validation MAE (minimize). Lower is better.
    # Test set: Reserved strictly for final unbiased evaluation after model selection.
    print("\n--- STEP 3: Training Baseline Regressors ---")
    models = get_baseline_models(random_state=42)

    all_metrics = []
    all_predictions_dfs = []

    best_val_model_name = None
    best_val_mae = float("inf")

    for model_name, model in models.items():
        print(f"\nTraining {model_name}...")
        model.fit(X_train, y_train)

        # Predict on Train, Val, Test
        pred_train = model.predict(X_train)
        pred_val = model.predict(X_val)
        pred_test = model.predict(X_test)

        # Compute Metrics
        metrics_train = compute_metrics(y_train, pred_train)
        metrics_val = compute_metrics(y_val, pred_val)
        metrics_test = compute_metrics(y_test, pred_test)

        print_metrics_table(metrics_train, title=f"{model_name} - TRAIN")
        print_metrics_table(metrics_val, title=f"{model_name} - VALIDATION")
        print_metrics_table(metrics_test, title=f"{model_name} - TEST")

        # Select Model based on Validation MAE (minimize)
        if metrics_val['MAE'] < best_val_mae:
            best_val_mae = metrics_val['MAE']
            best_val_model_name = model_name

        # Store metrics rows
        for split_name, m_dict in [("Train", metrics_train), ("Validation", metrics_val), ("Test", metrics_test)]:
            row = {"model": model_name, "split": split_name}
            row.update(m_dict)
            all_metrics.append(row)

        # Build prediction DataFrames
        for split_name, df_split, pred_arr in [
            ("train", df_train, pred_train),
            ("val", df_val, pred_val),
            ("test", df_test, pred_test)
        ]:
            pred_df = pd.DataFrame({
                "experiment_id": df_split["experiment_id"],
                "protein_name": df_split["protein_name"],
                "uniprot_id": df_split["uniprot_id"],
                "pdb_id_corrected": df_split["pdb_id_corrected"],
                "chain": df_split["chain"],
                "position": df_split["position"],
                "wild_type": df_split["wild_type"],
                "mutation": df_split["mutation"],
                "experimental_ddG": df_split["ddG"],
                "predicted_ddG": pred_arr,
                "split": split_name,
                "model": model_name
            })
            all_predictions_dfs.append(pred_df)

    # Save Model Selection Configuration Artifact
    model_sel_config = {
        "primary_selection_metric": "validation_MAE",
        "direction": "minimize",
        "evaluation_protocol": "Model selection strictly based on Validation MAE. Test set reserved for final evaluation.",
        "best_model_selected": best_val_model_name,
        "best_validation_MAE": best_val_mae,
        "hyperparameters": {
            "Ridge": {"alpha": 10.0, "random_state": 42},
            "RandomForest": {"n_estimators": 150, "max_depth": 12, "random_state": 42},
            "GradientBoosting": {"n_estimators": 150, "learning_rate": 0.05, "max_depth": 5, "random_state": 42}
        }
    }
    model_sel_path = os.path.join(results_dir, "model_selection_config.json")
    with open(model_sel_path, "w") as f:
        json.dump(model_sel_config, f, indent=2)
    print(f"Saved model selection config artifact to: {model_sel_path}")

    # Save Metrics & Predictions
    metrics_df = pd.DataFrame(all_metrics)
    metrics_csv_path = os.path.join(results_dir, "baseline_metrics.csv")
    metrics_df.to_csv(metrics_csv_path, index=False)
    print(f"Saved structured metrics to: {metrics_csv_path}")

    predictions_df = pd.concat(all_predictions_dfs, ignore_index=True)
    predictions_csv_path = os.path.join(results_dir, "baseline_predictions.csv")
    predictions_df.to_csv(predictions_csv_path, index=False)
    print(f"Saved real predictions to:  {predictions_csv_path}")

    print("\n==================================================")
    print(f"  BENCHMARK SUMMARY — SELECTED MODEL: {best_val_model_name}")
    print("==================================================")
    best_val_metrics = metrics_df[(metrics_df['model'] == best_val_model_name) & (metrics_df['split'] == 'Validation')].iloc[0]
    best_test_metrics = metrics_df[(metrics_df['model'] == best_val_model_name) & (metrics_df['split'] == 'Test')].iloc[0]

    print(f"Selected Model (by Validation MAE): {best_val_model_name}")
    print(f"  Val MAE:      {best_val_metrics['MAE']:.4f} kcal/mol")
    print(f"  Val RMSE:     {best_val_metrics['RMSE']:.4f} kcal/mol")
    print(f"  Val R^2:      {best_val_metrics['R2']:.4f}")
    print(f"  Val Pearson:  {best_val_metrics['Pearson']:.4f}")
    print(f"  Val Spearman: {best_val_metrics['Spearman']:.4f}")

    print(f"\nFinal Test Evaluation for Selected Baseline ({best_val_model_name}):")
    print(f"  Test MAE:      {best_test_metrics['MAE']:.4f} kcal/mol")
    print(f"  Test RMSE:     {best_test_metrics['RMSE']:.4f} kcal/mol")
    print(f"  Test R^2:      {best_test_metrics['R2']:.4f}")
    print(f"  Test Pearson:  {best_test_metrics['Pearson']:.4f}")
    print(f"  Test Spearman: {best_test_metrics['Spearman']:.4f}")
    print("==================================================")

if __name__ == "__main__":
    run_sequence_baseline_benchmark()
