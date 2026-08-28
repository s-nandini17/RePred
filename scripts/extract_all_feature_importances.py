import os
import sys
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# Ensure src modules are in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.data.dataset import FireProtDataset
from src.representations.sequence import SequenceRepresentationExtractor, AA_LIST

def assign_3d_group(feature_name):
    if feature_name in ['dist_local_COM_A', 'dist_protein_COM_A', 'contact_count_6A', 'contact_count_8A', 'contact_count_10A', 'contact_count_12A', 'packing_density_10A']:
        return "Spatial geometry"
    elif feature_name in ['Calpha_B_factor', 'norm_B_factor', 'sin_phi', 'cos_phi', 'sin_psi', 'cos_psi']:
        return "Backbone / B-factor"
    elif feature_name.startswith('comp_count_10A_'):
        return "Local amino-acid composition"
    elif feature_name.startswith('dist_weighted_comp_10A_'):
        return "Distance-weighted composition"
    elif feature_name.startswith('loc_') and feature_name.endswith('_10A'):
        return "Physicochemical environment"
    elif feature_name.startswith('delta_') or feature_name.startswith('mut_onehot_') or feature_name.startswith('wt_onehot_'):
        return "Mutation-specific biochemical changes"
    elif feature_name.startswith('nearest_neighbor_') or feature_name.startswith('nearest_5_top_aa_comp_'):
        return "Nearest-neighbor environment"
    else:
        return "Spatial geometry"

def assign_contact_group(feature_name):
    if feature_name.startswith('contacts_') or feature_name.startswith('contact_density_'):
        return "Contact counts / network"
    elif feature_name.startswith('seq_sep_'):
        return "Sequence separation"
    elif feature_name.startswith('contacted_aa_cnt_'):
        return "Contacted amino-acid composition"
    elif feature_name.startswith('contacted_aa_prop_'):
        return "Contacted amino-acid proportions"
    elif feature_name.startswith('contact_phys_') or feature_name.startswith('contact_vdw_') or feature_name.startswith('contact_charge_') or feature_name.startswith('contact_polarity_') or feature_name.startswith('contact_weight_'):
        return "Contact physicochemical environment"
    elif feature_name.startswith('delta_') or feature_name.startswith('wt_onehot_') or feature_name.startswith('mut_onehot_'):
        return "Mutation information"
    else:
        return "Contact counts / network"

def assign_sequence_group(feature_name):
    if feature_name.startswith('delta_') or feature_name.startswith('wt_onehot_') or feature_name.startswith('mut_onehot_') or feature_name == 'blosum62':
        return "Mutation substitution deltas"
    elif feature_name.startswith('flank_'):
        return "Flanking sequence context"
    elif feature_name.startswith('position') or feature_name.startswith('seq_len') or feature_name.startswith('rel_position'):
        return "Sequence position"
    elif feature_name.startswith('wt_') or feature_name.startswith('mut_'):
        return "Sidechain properties"
    else:
        return "Sequence context features"

def get_sequence_feature_names():
    names = []
    for aa in AA_LIST:
        names.append(f"wt_onehot_{aa}")
    for aa in AA_LIST:
        names.append(f"mut_onehot_{aa}")
    names.extend([
        "blosum62", "delta_hydrophobicity", "delta_volume_vdw", "delta_pi_charge", "delta_mol_weight",
        "wt_hydrophobicity", "mut_hydrophobicity", "wt_volume_vdw", "mut_volume_vdw"
    ])
    names.extend(["position", "seq_len", "rel_position"])
    for pos_offset in range(-5, 0):
        for aa in AA_LIST:
            names.append(f"flank_left_{pos_offset}_{aa}")
    for pos_offset in range(1, 6):
        for aa in AA_LIST:
            names.append(f"flank_right_+{pos_offset}_{aa}")
    return names

def main():
    interp_dir = "results/interpretability"
    plots_dir = "results/plots"
    os.makedirs(interp_dir, exist_ok=True)
    os.makedirs(plots_dir, exist_ok=True)

    dataset = FireProtDataset(data_dir="project/data/fireprot/original_copies")
    df_official = dataset.get_split("combined")[['experiment_id', 'split', 'ddG']].drop_duplicates(subset=['experiment_id'])

    # 1. 3D
    print("--- Extracting 3D Feature Importances ---")
    df_3d = pd.read_csv("results/structural_features.csv")
    df_3d_merged = pd.merge(df_3d, df_official, on='experiment_id', how='left')

    metadata_cols = ['experiment_id', 'uniprot_id', 'pdb_id', 'chain', 'position', 'pdb_position', 'wt_aa', 'mut_aa', 'ddG', 'split', 'mapping_status']
    feature_cols_3d = [c for c in df_3d.columns if c not in metadata_cols and pd.api.types.is_numeric_dtype(df_3d[c])]

    df_3d_tr = df_3d_merged[df_3d_merged['split'] == 'train'].reset_index(drop=True)
    X_3d_tr = df_3d_tr[feature_cols_3d].values.astype(np.float32)
    y_3d_tr = df_3d_tr['ddG'].values.astype(np.float32)

    rf_3d = RandomForestRegressor(n_estimators=150, max_depth=12, random_state=42, n_jobs=-1)
    rf_3d.fit(X_3d_tr, y_3d_tr)

    imp_3d = rf_3d.feature_importances_
    df_imp_3d = pd.DataFrame({'feature_name': feature_cols_3d, 'importance': imp_3d})
    df_imp_3d.sort_values(by='importance', ascending=False, inplace=True)
    df_imp_3d['rank'] = range(1, len(df_imp_3d) + 1)
    df_imp_3d['feature_group'] = df_imp_3d['feature_name'].apply(assign_3d_group)

    p_3d_out = os.path.join(interp_dir, "3d_feature_importance.csv")
    df_imp_3d.to_csv(p_3d_out, index=False)
    print(f"Saved 3D feature importances to: {p_3d_out}")

    # 2. Contact Map
    print("--- Extracting Contact Map Feature Importances ---")
    df_cm = pd.read_csv("results/contact_map_features.csv")
    df_cm_merged = pd.merge(df_cm, df_official, on='experiment_id', how='left')

    feature_cols_cm = [c for c in df_cm.columns if c not in metadata_cols and pd.api.types.is_numeric_dtype(df_cm[c])]

    df_cm_tr = df_cm_merged[df_cm_merged['split'] == 'train'].reset_index(drop=True)
    X_cm_tr = df_cm_tr[feature_cols_cm].values.astype(np.float32)
    y_cm_tr = df_cm_tr['ddG'].values.astype(np.float32)

    rf_cm = RandomForestRegressor(n_estimators=150, max_depth=12, random_state=42, n_jobs=-1)
    rf_cm.fit(X_cm_tr, y_cm_tr)

    imp_cm = rf_cm.feature_importances_
    df_imp_cm = pd.DataFrame({'feature_name': feature_cols_cm, 'importance': imp_cm})
    df_imp_cm.sort_values(by='importance', ascending=False, inplace=True)
    df_imp_cm['rank'] = range(1, len(df_imp_cm) + 1)
    df_imp_cm['feature_group'] = df_imp_cm['feature_name'].apply(assign_contact_group)

    p_cm_out = os.path.join(interp_dir, "contact_map_feature_importance.csv")
    df_imp_cm.to_csv(p_cm_out, index=False)
    print(f"Saved Contact Map feature importances to: {p_cm_out}")

    # 3. Sequence
    print("--- Extracting Sequence Feature Importances ---")
    extractor_seq = SequenceRepresentationExtractor()
    df_seq_clean = dataset.df_combined.copy()
    X_seq_all = extractor_seq.transform_dataframe(df_seq_clean)
    
    feature_cols_seq = get_sequence_feature_names()

    df_seq_tr_mask = (df_seq_clean['split'] == 'train').values
    X_seq_tr = X_seq_all[df_seq_tr_mask].astype(np.float32)
    y_seq_tr = df_seq_clean.loc[df_seq_tr_mask, 'ddG'].values.astype(np.float32)

    rf_seq = RandomForestRegressor(n_estimators=150, max_depth=12, random_state=42, n_jobs=-1)
    rf_seq.fit(X_seq_tr, y_seq_tr)

    imp_seq = rf_seq.feature_importances_
    df_imp_seq = pd.DataFrame({'feature_name': feature_cols_seq, 'importance': imp_seq})
    df_imp_seq.sort_values(by='importance', ascending=False, inplace=True)
    df_imp_seq['rank'] = range(1, len(df_imp_seq) + 1)
    df_imp_seq['feature_group'] = df_imp_seq['feature_name'].apply(assign_sequence_group)

    p_seq_out = os.path.join(interp_dir, "sequence_feature_importance.csv")
    df_imp_seq.to_csv(p_seq_out, index=False)
    print(f"Saved Sequence feature importances to: {p_seq_out}")

    # 4. Master Summary Table
    top_3d = df_imp_3d.head(15).copy()
    top_3d['representation'] = "Experimental WT 3D"

    top_cm = df_imp_cm.head(15).copy()
    top_cm['representation'] = "Experimental WT Contact Map"

    top_seq = df_imp_seq.head(15).copy()
    top_seq['representation'] = "Hand-Engineered Sequence"

    def get_interpretation(row):
        fn = row['feature_name']
        fg = row['feature_group']

        if fn.startswith('loc_mol_weight'):
            return "Total molecular mass of local residues within 10 Å spatial radius"
        elif fn == 'delta_hydrophobicity':
            return "Biochemical change in Kyte-Doolittle hydrophobicity from WT to MUT"
        elif fn == 'delta_volume_vdw':
            return "Van der Waals volume delta resulting from amino-acid substitution"
        elif fn == 'delta_mol_weight':
            return "Molecular weight difference between WT and MUT side-chains"
        elif fn == 'contact_phys_mol_weight_8A':
            return "Summed molecular weight of contacting residues within 8.0 Å"
        elif fn == 'contact_phys_hydrophobicity_8A':
            return "Summed hydrophobicity of contact neighborhood within 8.0 Å"
        elif fn.startswith('contacts_8A'):
            return "Total number of Cα contact neighbors within 8.0 Å threshold"
        elif fn.startswith('seq_sep_medium'):
            return "Count of contacts from medium sequence separation range (12 to 24 residues)"
        elif fn.startswith('sin_phi') or fn.startswith('Calpha_B'):
            return "Local backbone flexibility and conformational dihedral angle state"
        else:
            return f"Predictive reliance on {fg} ({fn})"

    df_summary = pd.concat([top_seq, top_3d, top_cm], ignore_index=True)
    df_summary['interpretation'] = df_summary.apply(get_interpretation, axis=1)
    df_summary = df_summary[['representation', 'feature_group', 'feature_name', 'importance', 'rank', 'interpretation']]

    p_summary_out = os.path.join(interp_dir, "representation_feature_summary.csv")
    df_summary.to_csv(p_summary_out, index=False)
    print(f"Saved master feature summary table to: {p_summary_out}")

    # 5. Visualization
    fig, axes = plt.subplots(1, 3, figsize=(18, 7))

    # Panel 1: Sequence
    seq_top15 = df_imp_seq.head(15).iloc[::-1]
    axes[0].barh(seq_top15['feature_name'], seq_top15['importance'], color='#1f77b4', edgecolor='black', alpha=0.85)
    axes[0].set_title("A. Sequence (Top 15 Features)", fontsize=11, fontweight='bold')
    axes[0].set_xlabel("Random Forest Feature Importance", fontsize=10)
    axes[0].grid(True, linestyle=':', alpha=0.6, axis='x')

    # Panel 2: 3D
    d3_top15 = df_imp_3d.head(15).iloc[::-1]
    axes[1].barh(d3_top15['feature_name'], d3_top15['importance'], color='#2ca02c', edgecolor='black', alpha=0.85)
    axes[1].set_title("B. Experimental WT 3D (Top 15 Features)", fontsize=11, fontweight='bold')
    axes[1].set_xlabel("Random Forest Feature Importance", fontsize=10)
    axes[1].grid(True, linestyle=':', alpha=0.6, axis='x')

    # Panel 3: Contact Map
    cm_top15 = df_imp_cm.head(15).iloc[::-1]
    axes[2].barh(cm_top15['feature_name'], cm_top15['importance'], color='#d62728', edgecolor='black', alpha=0.85)
    axes[2].set_title("C. Contact Map (Top 15 Features)", fontsize=11, fontweight='bold')
    axes[2].set_xlabel("Random Forest Feature Importance", fontsize=10)
    axes[2].grid(True, linestyle=':', alpha=0.6, axis='x')

    plt.suptitle("FireProt ΔΔG Benchmark — Feature Importance Interpretability Analysis", fontsize=13, fontweight='bold', y=1.02)
    plt.tight_layout()
    plot_path = os.path.join(plots_dir, "representation_feature_importance.png")
    plt.savefig(plot_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Saved feature importance plot to: {plot_path}")

if __name__ == "__main__":
    main()
