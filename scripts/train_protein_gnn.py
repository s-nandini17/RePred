import os
import sys
import json
import random
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from sklearn.model_selection import GroupKFold

# Ensure src modules are in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.data.dataset import FireProtDataset
from src.models.protein_gnn import PDBGraphBuilder, ProteinGNN, collate_graph_samples
from src.evaluation.metrics import compute_metrics, print_metrics_table

def set_seed(seed=42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

class FastMutationGraphDataset(Dataset):
    """
    Fast Dataset wrapper drawing pre-cached PyTorch graph objects.
    """
    def __init__(self, df, cache):
        self.samples = [cache[str(row["experiment_id"])] for _, row in df.iterrows()]

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        return self.samples[idx]

def train_epoch(model, dataloader, optimizer, criterion, device):
    model.train()
    total_loss = 0.0
    total_samples = 0
    for batch in dataloader:
        batch_dev = {
            "x": batch["x"].to(device),
            "edge_index": batch["edge_index"].to(device),
            "edge_attr": batch["edge_attr"].to(device),
            "mutation_idx": batch["mutation_idx"].to(device),
            "mutation_deltas": batch["mutation_deltas"].to(device)
        }
        target = batch["ddG"].to(device)

        optimizer.zero_grad()
        pred = model(batch_dev)
        loss = criterion(pred, target)
        loss.backward()
        optimizer.step()

        b_size = target.size(0)
        total_loss += loss.item() * b_size
        total_samples += b_size

    return total_loss / total_samples

@torch.no_grad()
def eval_dataloader(model, dataloader, device):
    model.eval()
    preds = []
    targets = []
    for batch in dataloader:
        batch_dev = {
            "x": batch["x"].to(device),
            "edge_index": batch["edge_index"].to(device),
            "edge_attr": batch["edge_attr"].to(device),
            "mutation_idx": batch["mutation_idx"].to(device),
            "mutation_deltas": batch["mutation_deltas"].to(device)
        }
        pred = model(batch_dev)
        preds.extend(pred.cpu().numpy().tolist())
        targets.extend(batch["ddG"].cpu().numpy().tolist())

    preds = np.array(preds, dtype=np.float64)
    targets = np.array(targets, dtype=np.float64)
    metrics = compute_metrics(targets, preds)
    return metrics, preds, targets

def main():
    print("==================================================", flush=True)
    print("  MILESTONE 6A — EXPERIMENTAL WT PROTEIN GNN BENCHMARK  ", flush=True)
    print("==================================================", flush=True)

    set_seed(42)

    results_dir = "results"
    plots_dir = os.path.join(results_dir, "plots")
    os.makedirs(results_dir, exist_ok=True)
    os.makedirs(plots_dir, exist_ok=True)

    # 1. Load Mapped Mutations
    mapping_path = os.path.join(results_dir, "pdb_mapping.csv")
    if not os.path.exists(mapping_path):
        raise FileNotFoundError(f"Mapping file missing: {mapping_path}")

    df_mapping = pd.read_csv(mapping_path)
    df_mapped = df_mapping[df_mapping['mapping_status'] == 'MAPPED_MATCH'].copy().reset_index(drop=True)

    dataset = FireProtDataset(data_dir="project/data/fireprot/original_copies")
    df_official_comb = dataset.get_split("combined")[['experiment_id', 'split', 'ddG']].drop_duplicates(subset=['experiment_id'])

    df_merged = pd.merge(df_mapped, df_official_comb, on='experiment_id', how='left')

    df_train = df_merged[df_merged['split'] == 'train'].reset_index(drop=True)
    df_val = df_merged[df_merged['split'] == 'val'].reset_index(drop=True)
    df_test = df_merged[df_merged['split'] == 'test'].reset_index(drop=True)
    df_dev = df_merged[df_merged['split'].isin(['train', 'val'])].reset_index(drop=True)

    print("\n--- STEP 1: Dataset & Protein Isolation Audit ---", flush=True)
    print(f"Train samples:      {len(df_train)}", flush=True)
    print(f"Validation samples: {len(df_val)}", flush=True)
    print(f"Test samples:       {len(df_test)}", flush=True)
    print(f"Total mapped:       {len(df_merged)}", flush=True)

    train_uniprots = set(df_train['uniprot_id'].unique())
    val_uniprots = set(df_val['uniprot_id'].unique())
    test_uniprots = set(df_test['uniprot_id'].unique())

    print(f"Unique UniProt IDs in Train:      {len(train_uniprots)}", flush=True)
    print(f"Unique UniProt IDs in Validation: {len(val_uniprots)}", flush=True)
    print(f"Unique UniProt IDs in Test:       {len(test_uniprots)}", flush=True)
    print(f"Train ∩ Validation Overlap:       {len(train_uniprots.intersection(val_uniprots))}", flush=True)
    print(f"Train ∩ Test Overlap:             {len(train_uniprots.intersection(test_uniprots))}", flush=True)
    print(f"Validation ∩ Test Overlap:        {len(val_uniprots.intersection(test_uniprots))}", flush=True)

    # 2. Build & Cache All 3,433 Mutation Protein Graphs ONCE
    print("\n--- STEP 2: Pre-building Real Experimental WT Protein Graphs (N=3,433) ---", flush=True)
    graph_builder = PDBGraphBuilder(pdb_dir="project/data/fireprot/pdbs", contact_threshold=8.0)

    sample_cache = {}
    for idx, row in df_merged.iterrows():
        exp_id = str(row["experiment_id"])
        g_data = graph_builder.build_mutation_graph(row)
        g_data["ddG"] = torch.tensor(float(row["ddG"]), dtype=torch.float32)
        g_data["experiment_id"] = exp_id
        g_data["uniprot_id"] = str(row["uniprot_id"])
        g_data["pdb_id"] = str(row["pdb_id"])
        g_data["mutation"] = str(row["mutation"])
        g_data["split"] = str(row["split"])
        sample_cache[exp_id] = g_data

    print(f"Successfully cached {len(sample_cache)} real mutation graph samples in memory.", flush=True)

    batch_size = 128
    ds_train = FastMutationGraphDataset(df_train, sample_cache)
    ds_val = FastMutationGraphDataset(df_val, sample_cache)
    ds_test = FastMutationGraphDataset(df_test, sample_cache)

    loader_train = DataLoader(ds_train, batch_size=batch_size, shuffle=True, collate_fn=collate_graph_samples)
    loader_val = DataLoader(ds_val, batch_size=batch_size, shuffle=False, collate_fn=collate_graph_samples)
    loader_test = DataLoader(ds_test, batch_size=batch_size, shuffle=False, collate_fn=collate_graph_samples)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using compute device: {device}", flush=True)

    # 3. Train Official GNN Model
    print("\n--- STEP 3: Training ProteinGNN Baseline Model (58D Node Input, 64D Hidden) ---", flush=True)
    model = ProteinGNN(in_node_dim=58, hidden_dim=64, edge_dim=3, layers=3, dropout=0.1).to(device)

    optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-4)
    criterion = nn.MSELoss()

    best_val_mae = float("inf")
    best_model_state = None
    patience = 15
    patience_counter = 0

    history_train_loss = []
    history_val_mae = []

    for epoch in range(1, 101):
        loss_tr = train_epoch(model, loader_train, optimizer, criterion, device)
        m_va, _, _ = eval_dataloader(model, loader_val, device)
        val_mae = m_va["MAE"]

        history_train_loss.append(loss_tr)
        history_val_mae.append(val_mae)

        if val_mae < best_val_mae:
            best_val_mae = val_mae
            best_model_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}
            patience_counter = 0
        else:
            patience_counter += 1

        if epoch % 10 == 0 or epoch == 1:
            print(f"Epoch {epoch:03d}/100 | Train Loss (MSE): {loss_tr:.4f} | Val MAE: {val_mae:.4f} (Best: {best_val_mae:.4f})", flush=True)

        if patience_counter >= patience:
            print(f"\nEarly stopping triggered at Epoch {epoch}! Best Val MAE: {best_val_mae:.4f}", flush=True)
            break

    # Load best model weights
    model.load_state_dict({k: v.to(device) for k, v in best_model_state.items()})

    m_train, pred_train, y_train = eval_dataloader(model, loader_train, device)
    m_val, pred_val, y_val = eval_dataloader(model, loader_val, device)
    m_test, pred_test, y_test = eval_dataloader(model, loader_test, device)

    print_metrics_table(m_train, title="ProteinGNN - TRAIN")
    print_metrics_table(m_val, title="ProteinGNN - VALIDATION")
    print_metrics_table(m_test, title="ProteinGNN - TEST")

    # 4. Grouped 5-Fold Cross-Protein Robustness CV
    print("\n--- STEP 4: Grouped 5-Fold Cross-Protein Robustness CV ---", flush=True)
    gkf = GroupKFold(n_splits=5)
    groups_dev = df_dev['uniprot_id'].values

    fold_metrics = []

    for fold, (f_tr_idx, f_va_idx) in enumerate(gkf.split(df_dev, df_dev['ddG'], groups=groups_dev)):
        set_seed(42 + fold)
        assert len(set(groups_dev[f_tr_idx]).intersection(set(groups_dev[f_va_idx]))) == 0

        df_f_tr = df_dev.iloc[f_tr_idx].reset_index(drop=True)
        df_f_va = df_dev.iloc[f_va_idx].reset_index(drop=True)

        ds_f_tr = FastMutationGraphDataset(df_f_tr, sample_cache)
        ds_f_va = FastMutationGraphDataset(df_f_va, sample_cache)

        loader_f_tr = DataLoader(ds_f_tr, batch_size=batch_size, shuffle=True, collate_fn=collate_graph_samples)
        loader_f_va = DataLoader(ds_f_va, batch_size=batch_size, shuffle=False, collate_fn=collate_graph_samples)

        model_f = ProteinGNN(in_node_dim=58, hidden_dim=64, edge_dim=3, layers=3, dropout=0.1).to(device)
        opt_f = optim.Adam(model_f.parameters(), lr=0.001, weight_decay=1e-4)

        b_val_mae = float("inf")
        b_state_f = None
        pat_cnt = 0

        for ep in range(1, 101):
            train_epoch(model_f, loader_f_tr, opt_f, criterion, device)
            m_f_va, _, _ = eval_dataloader(model_f, loader_f_va, device)
            v_mae = m_f_va["MAE"]

            if v_mae < b_val_mae:
                b_val_mae = v_mae
                b_state_f = {k: v.cpu().clone() for k, v in model_f.state_dict().items()}
                pat_cnt = 0
            else:
                pat_cnt += 1

            if pat_cnt >= 15:
                break

        model_f.load_state_dict({k: v.to(device) for k, v in b_state_f.items()})
        m_f_best, _, _ = eval_dataloader(model_f, loader_f_va, device)
        fold_metrics.append(m_f_best)
        print(f"Fold {fold+1}/5 Best Val MAE: {m_f_best['MAE']:.4f} | Pearson r: {m_f_best['Pearson']:.4f}", flush=True)

    df_f_metrics = pd.DataFrame(fold_metrics)
    m_cv_mean = df_f_metrics.mean()
    m_cv_std = df_f_metrics.std()

    print(f"\nGrouped 5-Fold CV MAE:     {m_cv_mean['MAE']:.4f} ± {m_cv_std['MAE']:.4f}", flush=True)
    print(f"Grouped 5-Fold CV RMSE:    {m_cv_mean['RMSE']:.4f} ± {m_cv_std['RMSE']:.4f}", flush=True)
    print(f"Grouped 5-Fold CV R^2:     {m_cv_mean['R2']:.4f} ± {m_cv_std['R2']:.4f}", flush=True)
    print(f"Grouped 5-Fold CV Pearson: {m_cv_mean['Pearson']:.4f} ± {m_cv_std['Pearson']:.4f}", flush=True)
    print(f"Grouped 5-Fold CV Spearman:{m_cv_mean['Spearman']:.4f} ± {m_cv_std['Spearman']:.4f}", flush=True)

    # Save Grouped CV CSV
    cv_out_path = os.path.join(results_dir, "protein_gnn_grouped_cv.csv")
    df_f_metrics.to_csv(cv_out_path, index=False)
    print(f"Saved Grouped CV metrics to: {cv_out_path}", flush=True)

    # 5. Save Test Predictions CSV
    df_test_preds = df_test[['experiment_id', 'uniprot_id', 'pdb_id', 'mutation', 'split', 'ddG']].copy()
    df_test_preds.rename(columns={'ddG': 'experimental_ddG'}, inplace=True)
    df_test_preds['predicted_ddG'] = pred_test
    df_test_preds['residual'] = pred_test - y_test

    preds_path = os.path.join(results_dir, "protein_gnn_predictions.csv")
    df_test_preds.to_csv(preds_path, index=False)
    print(f"Saved test predictions to: {preds_path}", flush=True)

    # 6. Save Metrics JSON & CSV
    metrics_payload = {
        "model_name": "ProteinGNN",
        "architecture": {
            "node_input_dim": 58,
            "edge_dim": 3,
            "hidden_dim": 64,
            "gnn_layers": 3,
            "readout": "mutation_node_embedding_64d_plus_deltas_5d",
            "mlp_layers": "Linear(69, 32) -> ReLU -> Linear(32, 1)"
        },
        "training_config": {
            "optimizer": "Adam",
            "learning_rate": 0.001,
            "weight_decay": 1e-4,
            "batch_size": batch_size,
            "max_epochs": 100,
            "early_stopping_patience": 15,
            "seed": 42
        },
        "sample_counts": {
            "train": len(df_train),
            "validation": len(df_val),
            "test": len(df_test)
        },
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

    metrics_json_path = os.path.join(results_dir, "protein_gnn_metrics.json")
    with open(metrics_json_path, "w") as f:
        json.dump(metrics_payload, f, indent=2)
    print(f"Saved metrics JSON to: {metrics_json_path}", flush=True)

    df_metrics_tabular = pd.DataFrame([{
        "Representation": "Experimental WT Protein GNN",
        "Architecture": "3-Layer EdgeConv (58D -> 64D)",
        "Train_MAE": m_train["MAE"], "Train_RMSE": m_train["RMSE"], "Train_R2": m_train["R2"],
        "Val_MAE": m_val["MAE"], "Val_RMSE": m_val["RMSE"], "Val_R2": m_val["R2"],
        "Test_MAE": m_test["MAE"], "Test_RMSE": m_test["RMSE"], "Test_R2": m_test["R2"],
        "Test_Pearson": m_test["Pearson"], "Test_Spearman": m_test["Spearman"],
        "CV_MAE_Mean": m_cv_mean["MAE"], "CV_MAE_Std": m_cv_std["MAE"],
        "CV_R2_Mean": m_cv_mean["R2"], "CV_R2_Std": m_cv_std["R2"]
    }])
    metrics_csv_path = os.path.join(results_dir, "protein_gnn_metrics.csv")
    df_metrics_tabular.to_csv(metrics_csv_path, index=False)
    print(f"Saved metrics CSV to: {metrics_csv_path}", flush=True)

    # 7. Diagnostic Plots
    print("\n--- STEP 5: Generating Diagnostic Plots ---", flush=True)

    # Plot 1: Predicted vs Experimental ddG
    plt.figure(figsize=(7, 6))
    plt.scatter(y_test, pred_test, alpha=0.6, color='#2e7d32', edgecolors='k', linewidths=0.5, s=35, label='Test Samples (N=350)')
    min_val = min(y_test.min(), pred_test.min()) - 0.5
    max_val = max(y_test.max(), pred_test.max()) + 0.5
    plt.plot([min_val, max_val], [min_val, max_val], 'k--', alpha=0.7, label='Ideal Identity')
    plt.title(f'Protein GNN — Predicted vs Experimental ΔΔG\nTest MAE={m_test["MAE"]:.4f}, R²={m_test["R2"]:.4f}, Pearson r={m_test["Pearson"]:.4f}', fontsize=10, pad=10)
    plt.xlabel('Experimental ΔΔG (kcal/mol)', fontsize=10)
    plt.ylabel('Predicted ΔΔG (kcal/mol)', fontsize=10)
    plt.grid(True, linestyle=':', alpha=0.6)
    plt.legend(loc='upper left', frameon=True)
    plt.tight_layout()
    p1_path = os.path.join(plots_dir, "protein_gnn_predicted_vs_experimental.png")
    plt.savefig(p1_path, dpi=300)
    plt.close()
    print(f"Saved plot: {p1_path}", flush=True)

    # Plot 2: Residual Distribution
    residuals = pred_test - y_test
    plt.figure(figsize=(7, 5))
    plt.hist(residuals, bins=30, color='#2e7d32', alpha=0.75, edgecolor='black', linewidth=0.5)
    plt.axvline(0, color='black', linestyle='--', linewidth=1.2)
    plt.title(f'Protein GNN — Test Set Residual Distribution\nMean={residuals.mean():.4f}, Std={residuals.std():.4f}', fontsize=10, pad=10)
    plt.xlabel('Residual (Predicted - Experimental ΔΔG)', fontsize=10)
    plt.ylabel('Sample Count', fontsize=10)
    plt.grid(True, linestyle=':', alpha=0.6)
    plt.tight_layout()
    p2_path = os.path.join(plots_dir, "protein_gnn_residual_distribution.png")
    plt.savefig(p2_path, dpi=300)
    plt.close()
    print(f"Saved plot: {p2_path}", flush=True)

    # Plot 3: Training Curve
    plt.figure(figsize=(8, 5))
    plt.plot(range(1, len(history_train_loss) + 1), history_train_loss, 'b-', label='Train Loss (MSE)')
    plt.plot(range(1, len(history_val_mae) + 1), history_val_mae, 'r-', label='Val MAE (kcal/mol)')
    plt.title('Protein GNN Training Curve', fontsize=11, pad=10)
    plt.xlabel('Epoch', fontsize=10)
    plt.ylabel('Loss / MAE', fontsize=10)
    plt.grid(True, linestyle=':', alpha=0.6)
    plt.legend(loc='upper right', frameon=True)
    plt.tight_layout()
    p3_path = os.path.join(plots_dir, "protein_gnn_training_curve.png")
    plt.savefig(p3_path, dpi=300)
    plt.close()
    print(f"Saved plot: {p3_path}", flush=True)

if __name__ == "__main__":
    main()
