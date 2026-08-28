import os
import sys
import json
import shutil
import pandas as pd

def main():
    results_dir = "results"
    pdbs_dir = "project/data/fireprot/pdbs"
    fe_data_dir = "frontend/public/data"
    fe_pdbs_dir = "frontend/public/pdbs"

    os.makedirs(fe_data_dir, exist_ok=True)
    os.makedirs(fe_pdbs_dir, exist_ok=True)

    print("--- 1. Preparing Mutations & Mapped Data ---")
    mapping_path = os.path.join(results_dir, "pdb_mapping.csv")
    df_mapping = pd.read_csv(mapping_path)
    df_mapped = df_mapping[df_mapping['mapping_status'] == 'MAPPED_MATCH'].copy()

    # Load splits from combined_fireprot
    dataset_path = "project/data/fireprot/original_copies/combined_fireprot.csv"
    if os.path.exists(dataset_path):
        df_official = pd.read_csv(dataset_path)[['experiment_id', 'split', 'ddG', 'sequence']].drop_duplicates(subset=['experiment_id'])
        df_merged = pd.merge(df_mapped, df_official, on='experiment_id', how='left')
    else:
        df_merged = df_mapped.copy()

    # Export mutations.json
    mutations_list = []
    for idx, row in df_merged.iterrows():
        pos = int(row["fireprot_position"]) if "fireprot_position" in row else int(row["position"])
        pdb_pos = int(float(row["pdb_residue_number"])) if "pdb_residue_number" in row and pd.notnull(row["pdb_residue_number"]) else pos
        wt = str(row["wild_type"]) if "wild_type" in row else str(row["wt_aa"])
        mut = str(row["mutation"]) if "mutation" in row else str(row["mut_aa"])

        mutations_list.append({
            "experiment_id": str(row["experiment_id"]),
            "uniprot_id": str(row["uniprot_id"]),
            "pdb_id": str(row["pdb_id"]),
            "chain": str(row["chain"]),
            "position": pos,
            "pdb_position": pdb_pos,
            "wt_aa": wt,
            "mut_aa": mut,
            "mutation": f"{wt}{pos}{mut}",
            "pdb_mutation": f"{wt}{pdb_pos}{mut}",
            "ddG": float(row["ddG"]) if "ddG" in row and pd.notnull(row["ddG"]) else 0.0,
            "split": str(row["split"]) if "split" in row and pd.notnull(row["split"]) else "train",
            "sequence": str(row["sequence"]) if "sequence" in row and pd.notnull(row["sequence"]) else ""
        })

    with open(os.path.join(fe_data_dir, "mutations.json"), "w") as f:
        json.dump(mutations_list, f, indent=2)
    print(f"Exported {len(mutations_list)} mutations to frontend/public/data/mutations.json")

    # --- 2. Preparing Benchmark Comparison ---
    print("--- 2. Preparing Benchmark Comparison ---")
    comp_path = os.path.join(results_dir, "final_representation_comparison.csv")
    if os.path.exists(comp_path):
        df_comp = pd.read_csv(comp_path)
        with open(os.path.join(fe_data_dir, "benchmark_comparison.json"), "w") as f:
            json.dump(df_comp.to_dict(orient="records"), f, indent=2)
        print("Exported benchmark_comparison.json")

    sum_path = os.path.join(results_dir, "final_benchmark_summary.json")
    if os.path.exists(sum_path):
        shutil.copy(sum_path, os.path.join(fe_data_dir, "benchmark_summary.json"))
        print("Copied benchmark_summary.json")

    # --- 3. Preparing Feature Importance Data ---
    print("--- 3. Preparing Interpretability Data ---")
    interp_dir = "results/interpretability"
    for filename in ["3d_feature_importance.csv", "contact_map_feature_importance.csv", "sequence_feature_importance.csv", "representation_feature_summary.csv"]:
        fp = os.path.join(interp_dir, filename)
        if os.path.exists(fp):
            df_i = pd.read_csv(fp)
            json_name = filename.replace(".csv", ".json")
            with open(os.path.join(fe_data_dir, json_name), "w") as f:
                json.dump(df_i.to_dict(orient="records"), f, indent=2)
            print(f"Exported {json_name}")

    # --- 4. Preparing Prediction Maps ---
    print("--- 4. Preparing Prediction Maps ---")
    pred_files = {
        "gnn": "protein_gnn_predictions.csv",
        "3d": "3d_baseline_predictions.csv",
        "contact_map": "contact_map_baseline_predictions.csv",
        "sequence": "baseline_predictions.csv"
    }

    predictions_map = {}
    for key, filename in pred_files.items():
        fp = os.path.join(results_dir, filename)
        if os.path.exists(fp):
            df_p = pd.read_csv(fp)
            for _, row in df_p.iterrows():
                exp_id = str(row["experiment_id"]) if "experiment_id" in row else None
                if exp_id:
                    if exp_id not in predictions_map:
                        predictions_map[exp_id] = {}
                    pred_val = float(row["predicted_ddG"]) if "predicted_ddG" in row else float(row["prediction"]) if "prediction" in row else None
                    if pred_val is not None:
                        predictions_map[exp_id][key] = pred_val

    with open(os.path.join(fe_data_dir, "predictions_map.json"), "w") as f:
        json.dump(predictions_map, f, indent=2)
    print(f"Exported predictions map for {len(predictions_map)} samples to predictions_map.json")

    # Feature maps
    df_3d = pd.read_csv(os.path.join(results_dir, "structural_features.csv"))
    features_3d_map = {}
    for _, row in df_3d.iterrows():
        exp_id = str(row["experiment_id"])
        features_3d_map[exp_id] = {k: float(v) if pd.api.types.is_numeric_dtype(type(v)) and pd.notnull(v) else str(v) for k, v in row.items() if k not in ['experiment_id', 'uniprot_id', 'pdb_id', 'chain', 'position', 'pdb_position', 'wt_aa', 'mut_aa', 'ddG', 'split', 'mapping_status']}
    with open(os.path.join(fe_data_dir, "features_3d_map.json"), "w") as f:
        json.dump(features_3d_map, f)
    print(f"Exported 3D feature map for {len(features_3d_map)} samples")

    df_cm = pd.read_csv(os.path.join(results_dir, "contact_map_features.csv"))
    features_cm_map = {}
    for _, row in df_cm.iterrows():
        exp_id = str(row["experiment_id"])
        features_cm_map[exp_id] = {k: float(v) if pd.api.types.is_numeric_dtype(type(v)) and pd.notnull(v) else str(v) for k, v in row.items() if k not in ['experiment_id', 'uniprot_id', 'pdb_id', 'chain', 'position', 'pdb_position', 'wt_aa', 'mut_aa', 'ddG', 'split', 'mapping_status']}
    with open(os.path.join(fe_data_dir, "features_cm_map.json"), "w") as f:
        json.dump(features_cm_map, f)
    print(f"Exported Contact Map feature map for {len(features_cm_map)} samples")

    # --- 5. Copying Real PDB Files ---
    print("--- 5. Copying PDB Files ---")
    if os.path.exists(pdbs_dir):
        pdb_files = [f for f in os.listdir(pdbs_dir) if f.endswith(".pdb")]
        for f in pdb_files:
            shutil.copy(os.path.join(pdbs_dir, f), os.path.join(fe_pdbs_dir, f))
        print(f"Copied {len(pdb_files)} experimental WT PDB files to frontend/public/pdbs/")

    print("\nFrontend data preparation complete!")

if __name__ == "__main__":
    main()
