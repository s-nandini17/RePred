import os
import sys
import json
import torch
import pandas as pd
import numpy as np

# Ensure src modules are in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.data.dataset import FireProtDataset
from src.representations.esm import ESMRepresentationExtractor
from src.models.baseline import get_baseline_models
from src.evaluation.metrics import compute_metrics, print_metrics_table

def run_esm_baseline_benchmark():
    print("==================================================")
    print("  MILESTONE 2: ESM-2 8M REPRESENTATION BENCHMARK  ")
    print("==================================================")

    results_dir = "results"
    os.makedirs(results_dir, exist_ok=True)
    cache_path = os.path.join(results_dir, "esm_embeddings_8m.pt")

    if not os.path.exists(cache_path):
        raise FileNotFoundError(f"ESM embedding cache missing at {cache_path}! Run scripts/extract_esm_embeddings.py first.")

    # 1. Load Real Data & Cached ESM Embeddings
    print("\n--- STEP 1: Loading Real Data & Cached ESM Embeddings ---")
    dataset = FireProtDataset(data_dir="project/data/fireprot/original_copies")
    df_train = dataset.get_split("train")
    df_val = dataset.get_split("val")
    df_test = dataset.get_split("test")

    cache_payload = torch.load(cache_path)
    wt_cache = cache_payload["wt_embeddings"]
    mut_cache = cache_payload["mut_embeddings"]
    print(f"Loaded ESM cache successfully! Total WT: {len(wt_cache)}, Total Mutant: {len(mut_cache)}")

    # Helper function to construct 1280-dim mutation features from cache
    def build_features_from_cache(df):
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

    # 2. Extract Feature Matrices
    print("\n--- STEP 2: Building 1,280-Dimensional Pure ESM Mutation Feature Matrices ---")
    X_train = build_features_from_cache(df_train)
    y_train = df_train['ddG'].values.astype(np.float64)

    X_val = build_features_from_cache(df_val)
    y_val = df_val['ddG'].values.astype(np.float64)

    X_test = build_features_from_cache(df_test)
    y_test = df_test['ddG'].values.astype(np.float64)

    print(f"X_train shape: {X_train.shape}, y_train shape: {y_train.shape}")
    print(f"X_val shape:   {X_val.shape}, y_val shape:   {y_val.shape}")
    print(f"X_test shape:  {X_test.shape}, y_test shape:  {y_test.shape}")
    assert X_train.shape[1] == 1280, f"Expected 1280 features, got {X_train.shape[1]}"

    # Save ESM Representation Configuration Artifact
    esm_config = {
        "model_name": "esm2_t6_8M_UR50D",
        "model_checkpoint": cache_payload["model_checkpoint"],
        "parameter_count": 7512474,
        "embedding_dimension": 320,
        "mutation_feature_dimension": 1280,
        "feature_schema": [
            "WT positional ESM embedding (320)",
            "MUT positional ESM embedding (320)",
            "Difference embedding MUT - WT (320)",
            "Mean-pooled WT sequence embedding (320)"
        ],
        "special_token_handling": "Token 0 is <cls>, Token L+1 is <eos>. 1-based biological position p maps directly to token index p.",
        "hand_engineered_features_included": False,
        "esm_frozen": True,
        "n_unique_wt_sequences": cache_payload["n_unique_wt"],
        "n_unique_mut_sequences": cache_payload["n_unique_mut"]
    }
    esm_config_path = os.path.join(results_dir, "esm_representation_config.json")
    with open(esm_config_path, "w") as f:
        json.dump(esm_config, f, indent=2)
    print(f"Saved ESM representation config artifact to: {esm_config_path}")

    # 3. Fit Downstream Models & Evaluate
    print("\n--- STEP 3: Training Downstream Baseline Regressors on ESM Representations ---")
    models = get_baseline_models(random_state=42)

    all_metrics = []
    all_predictions_dfs = []

    best_val_model_name = None
    best_val_mae = float("inf")

    for model_name, model in models.items():
        print(f"\nTraining {model_name} on 1,280-dim ESM Features...")
        model.fit(X_train, y_train)

        # Predict
        pred_train = model.predict(X_train)
        pred_val = model.predict(X_val)
        pred_test = model.predict(X_test)

        # Metrics
        metrics_train = compute_metrics(y_train, pred_train)
        metrics_val = compute_metrics(y_val, pred_val)
        metrics_test = compute_metrics(y_test, pred_test)

        print_metrics_table(metrics_train, title=f"ESM-2 8M + {model_name} - TRAIN")
        print_metrics_table(metrics_val, title=f"ESM-2 8M + {model_name} - VALIDATION")
        print_metrics_table(metrics_test, title=f"ESM-2 8M + {model_name} - TEST")

        # Select Model based on Validation MAE (minimize)
        if metrics_val['MAE'] < best_val_mae:
            best_val_mae = metrics_val['MAE']
            best_val_model_name = model_name

        # Store metrics
        for split_name, m_dict in [("Train", metrics_train), ("Validation", metrics_val), ("Test", metrics_test)]:
            row = {"model": f"ESM2_8M_{model_name}", "split": split_name}
            row.update(m_dict)
            all_metrics.append(row)

        # Store predictions
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
                "model": f"ESM2_8M_{model_name}"
            })
            all_predictions_dfs.append(pred_df)

    # Save ESM Metrics & Predictions
    metrics_df = pd.DataFrame(all_metrics)
    metrics_csv_path = os.path.join(results_dir, "esm_baseline_metrics.csv")
    metrics_df.to_csv(metrics_csv_path, index=False)

    predictions_df = pd.concat(all_predictions_dfs, ignore_index=True)
    predictions_csv_path = os.path.join(results_dir, "esm_baseline_predictions.csv")
    predictions_df.to_csv(predictions_csv_path, index=False)

    # 4. Generate Representation Comparison Artifact
    print("\n--- STEP 4: Generating Direct Representation Comparison Table ---")
    df_m1_metrics = pd.read_csv(os.path.join(results_dir, "baseline_metrics.csv"))

    comp_rows = []

    # Process Hand-Engineered Baseline (Milestone 1)
    for m_name in ["Ridge", "RandomForest", "GradientBoosting"]:
        val_m = df_m1_metrics[(df_m1_metrics['model'] == m_name) & (df_m1_metrics['split'] == 'Validation')].iloc[0]
        test_m = df_m1_metrics[(df_m1_metrics['model'] == m_name) & (df_m1_metrics['split'] == 'Test')].iloc[0]
        comp_rows.append({
            "representation": "HandEngineered_252D",
            "model": m_name,
            "validation_MAE": val_m["MAE"],
            "test_MAE": test_m["MAE"],
            "test_RMSE": test_m["RMSE"],
            "test_R2": test_m["R2"],
            "test_Pearson": test_m["Pearson"],
            "test_Spearman": test_m["Spearman"]
        })

    # Process ESM-2 8M Baseline (Milestone 2)
    for m_name in ["Ridge", "RandomForest", "GradientBoosting"]:
        full_m_name = f"ESM2_8M_{m_name}"
        val_m = metrics_df[(metrics_df['model'] == full_m_name) & (metrics_df['split'] == 'Validation')].iloc[0]
        test_m = metrics_df[(metrics_df['model'] == full_m_name) & (metrics_df['split'] == 'Test')].iloc[0]
        comp_rows.append({
            "representation": "ESM2_8M_1280D",
            "model": m_name,
            "validation_MAE": val_m["MAE"],
            "test_MAE": test_m["MAE"],
            "test_RMSE": test_m["RMSE"],
            "test_R2": test_m["R2"],
            "test_Pearson": test_m["Pearson"],
            "test_Spearman": test_m["Spearman"]
        })

    comp_df = pd.DataFrame(comp_rows)
    comp_csv_path = os.path.join(results_dir, "representation_comparison.csv")
    comp_df.to_csv(comp_csv_path, index=False)
    print(f"Saved representation comparison table to: {comp_csv_path}")

    print("\n==================================================")
    print(f"  BENCHMARK SUMMARY — BEST ESM MODEL: {best_val_model_name}")
    print("==================================================")
    best_esm_val = metrics_df[(metrics_df['model'] == f"ESM2_8M_{best_val_model_name}") & (metrics_df['split'] == 'Validation')].iloc[0]
    best_esm_test = metrics_df[(metrics_df['model'] == f"ESM2_8M_{best_val_model_name}") & (metrics_df['split'] == 'Test')].iloc[0]

    print(f"Selected Model (by Validation MAE): ESM2_8M_{best_val_model_name}")
    print(f"  Val MAE:      {best_esm_val['MAE']:.4f} kcal/mol")
    print(f"  Val RMSE:     {best_esm_val['RMSE']:.4f} kcal/mol")
    print(f"  Val R^2:      {best_esm_val['R2']:.4f}")
    print(f"  Val Pearson:  {best_esm_val['Pearson']:.4f}")
    print(f"  Val Spearman: {best_esm_val['Spearman']:.4f}")

    print(f"\nFinal Test Evaluation for Selected ESM Baseline (ESM2_8M_{best_val_model_name}):")
    print(f"  Test MAE:      {best_esm_test['MAE']:.4f} kcal/mol")
    print(f"  Test RMSE:     {best_esm_test['RMSE']:.4f} kcal/mol")
    print(f"  Test R^2:      {best_esm_test['R2']:.4f}")
    print(f"  Test Pearson:  {best_esm_test['Pearson']:.4f}")
    print(f"  Test Spearman: {best_esm_test['Spearman']:.4f}")

    print("\n" + comp_df.to_string(index=False))
    print("==================================================")

if __name__ == "__main__":
    run_esm_baseline_benchmark()
