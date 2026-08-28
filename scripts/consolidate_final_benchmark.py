import os
import sys
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

def main():
    results_dir = "results"
    plots_dir = os.path.join(results_dir, "plots")
    os.makedirs(results_dir, exist_ok=True)
    os.makedirs(plots_dir, exist_ok=True)

    # 1. Gather exact results for the 5 completed representations
    data = [
        {
            "representation": "Hand-Engineered Sequence",
            "feature_or_architecture": "252D + Random Forest",
            "test_mae": 1.5170132607987667,
            "test_rmse": 2.1823743846046426,
            "test_r2": 0.06840867372605253,
            "test_pearson": 0.2714562031002317,
            "test_spearman": 0.19844584108928354,
            "grouped_cv_mae_mean": 1.233615903415031,
            "grouped_cv_mae_std": 0.09410455850115822,
            "grouped_cv_rmse_mean": 1.6726626355403709,
            "grouped_cv_rmse_std": 0.19317769333444126,
            "grouped_cv_r2_mean": 0.03148456030566982,
            "grouped_cv_r2_std": 0.08680122918159239,
            "grouped_cv_pearson_mean": 0.3799963213437379,
            "grouped_cv_pearson_std": 0.06581914872291066,
            "grouped_cv_spearman_mean": 0.36198993536115587,
            "grouped_cv_spearman_std": 0.06726007185435609
        },
        {
            "representation": "ESM-2 8M",
            "feature_or_architecture": "1280D + Random Forest",
            "test_mae": 1.4335230573192237,
            "test_rmse": 2.1452290791689475,
            "test_r2": 0.09985126416695278,
            "test_pearson": 0.3424801604663377,
            "test_spearman": 0.32406607975039053,
            "grouped_cv_mae_mean": 1.2346844707943974,
            "grouped_cv_mae_std": 0.08584963645883059,
            "grouped_cv_rmse_mean": 1.6185302477233297,
            "grouped_cv_rmse_std": 0.14912896872136305,
            "grouped_cv_r2_mean": 0.0913123852730164,
            "grouped_cv_r2_std": 0.0629892617810452,
            "grouped_cv_pearson_mean": 0.40177888498557063,
            "grouped_cv_pearson_std": 0.0730873067213131,
            "grouped_cv_spearman_mean": 0.36148808266419086,
            "grouped_cv_spearman_std": 0.05961211783618846
        },
        {
            "representation": "Experimental WT 3D",
            "feature_or_architecture": "131D + Random Forest",
            "test_mae": 1.4532077119953033,
            "test_rmse": 2.123712213939546,
            "test_r2": 0.11781787278647227,
            "test_pearson": 0.35339906462262566,
            "test_spearman": 0.25420162656714324,
            "grouped_cv_mae_mean": 1.1473847305205807,
            "grouped_cv_mae_std": 0.10683121502763153,
            "grouped_cv_rmse_mean": 1.5464743324776538,
            "grouped_cv_rmse_std": 0.18459239317355616,
            "grouped_cv_r2_mean": 0.17202159300568004,
            "grouped_cv_r2_std": 0.09276281979970061,
            "grouped_cv_pearson_mean": 0.49527347403587374,
            "grouped_cv_pearson_std": 0.10868803941767671,
            "grouped_cv_spearman_mean": 0.44720037135616614,
            "grouped_cv_spearman_std": 0.12397056488317092
        },
        {
            "representation": "Experimental WT Contact Map",
            "feature_or_architecture": "107D + Random Forest",
            "test_mae": 1.4638493456758073,
            "test_rmse": 2.1701188284390716,
            "test_r2": 0.07884236669104316,
            "test_pearson": 0.30953633185734647,
            "test_spearman": 0.20477888550446305,
            "grouped_cv_mae_mean": 1.1233663918777395,
            "grouped_cv_mae_std": 0.1079914897052505,
            "grouped_cv_rmse_mean": 1.509045137735398,
            "grouped_cv_rmse_std": 0.17998839865143512,
            "grouped_cv_r2_mean": 0.20776491424551752,
            "grouped_cv_r2_std": 0.1292380048260539,
            "grouped_cv_pearson_mean": 0.5213576975285643,
            "grouped_cv_pearson_std": 0.13893258561284105,
            "grouped_cv_spearman_mean": 0.4749055735222317,
            "grouped_cv_spearman_std": 0.13659449074569366
        },
        {
            "representation": "Experimental WT Protein Graph",
            "feature_or_architecture": "3-Layer EdgeConv GNN (58D node / 3D edge)",
            "test_mae": 1.4519824984057674,
            "test_rmse": 2.1420953463229035,
            "test_r2": 0.10247920388857878,
            "test_pearson": 0.33096836135384033,
            "test_spearman": 0.281327502815263,
            "grouped_cv_mae_mean": 1.1337980332730688,
            "grouped_cv_mae_std": 0.06037614447108996,
            "grouped_cv_rmse_mean": 1.5508344977762756,
            "grouped_cv_rmse_std": 0.12413388419141179,
            "grouped_cv_r2_mean": 0.1650144022522775,
            "grouped_cv_r2_std": 0.047532865929776624,
            "grouped_cv_pearson_mean": 0.44971803523719966,
            "grouped_cv_pearson_std": 0.09546208229887317,
            "grouped_cv_spearman_mean": 0.41802931198534854,
            "grouped_cv_spearman_std": 0.08483695452709343
        }
    ]

    # Save final_representation_comparison.csv
    df_final = pd.DataFrame(data)
    csv_path = os.path.join(results_dir, "final_representation_comparison.csv")
    df_final.to_csv(csv_path, index=False)
    print(f"Saved master comparison CSV to: {csv_path}")

    # 2. Data Consistency Audit
    mapping_path = os.path.join(results_dir, "pdb_mapping.csv")
    df_mapping = pd.read_csv(mapping_path)
    df_mapped = df_mapping[df_mapping['mapping_status'] == 'MAPPED_MATCH'].copy()
    
    total_mapped = len(df_mapped)
    assert total_mapped == 3433, f"Expected 3433 mapped mutations, got {total_mapped}"

    # Load splits
    sys.path.insert(0, ".")
    from src.data.dataset import FireProtDataset
    dataset = FireProtDataset(data_dir="project/data/fireprot/original_copies")
    df_official = dataset.get_split("combined")[['experiment_id', 'split', 'ddG']].drop_duplicates(subset=['experiment_id'])
    df_merged = pd.merge(df_mapped, df_official, on='experiment_id', how='left')

    n_train = len(df_merged[df_merged['split'] == 'train'])
    n_val = len(df_merged[df_merged['split'] == 'val'])
    n_test = len(df_merged[df_merged['split'] == 'test'])
    n_dev = n_train + n_val

    assert n_train == 2681
    assert n_val == 402
    assert n_test == 350
    assert n_dev == 3083

    train_u = set(df_merged[df_merged['split'] == 'train']['uniprot_id'].unique())
    val_u = set(df_merged[df_merged['split'] == 'val']['uniprot_id'].unique())
    test_u = set(df_merged[df_merged['split'] == 'test']['uniprot_id'].unique())

    assert len(train_u.intersection(val_u)) == 0
    assert len(train_u.intersection(test_u)) == 0
    assert len(val_u.intersection(test_u)) == 0

    print("Data consistency audit PASSED.")

    # 3. Create Final Plot: final_representation_benchmark.png
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

    labels = [d["representation"].replace("Hand-Engineered ", "").replace("Experimental WT ", "") for d in data]
    colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd']

    # Panel A: Official Test MAE
    test_maes = [d["test_mae"] for d in data]
    bars1 = ax1.bar(labels, test_maes, color=colors, alpha=0.85, edgecolor='black', width=0.55)
    ax1.set_title("A. Official Held-Out Test MAE (kcal/mol)\n(ESM-2 achieves lowest error)", fontsize=11, fontweight='bold', pad=12)
    ax1.set_ylabel("MAE (kcal/mol)", fontsize=10)
    ax1.set_ylim(1.35, 1.55)
    ax1.grid(True, linestyle=':', alpha=0.6, axis='y')
    for bar in bars1:
        height = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2., height + 0.003, f"{height:.4f}", ha='center', va='bottom', fontsize=9, fontweight='bold')

    # Panel B: Grouped CV MAE mean ± SD
    cv_maes = [d["grouped_cv_mae_mean"] for d in data]
    cv_stds = [d["grouped_cv_mae_std"] for d in data]
    bars2 = ax2.bar(labels, cv_maes, yerr=cv_stds, capsize=5, color=colors, alpha=0.85, edgecolor='black', width=0.55, error_kw={'ecolor': 'black', 'linewidth': 1.5})
    ax2.set_title("B. Grouped Cross-Protein CV MAE (Mean ± SD)\n(Contact Map achieves lowest error)", fontsize=11, fontweight='bold', pad=12)
    ax2.set_ylabel("Mean CV MAE (kcal/mol)", fontsize=10)
    ax2.set_ylim(1.00, 1.35)
    ax2.grid(True, linestyle=':', alpha=0.6, axis='y')
    for bar, std in zip(bars2, cv_stds):
        height = bar.get_height()
        ax2.text(bar.get_x() + bar.get_width()/2., height + std + 0.008, f"{height:.4f}", ha='center', va='bottom', fontsize=9, fontweight='bold')

    plt.suptitle("FireProt Protein Stability Benchmark — Final Representation Comparison", fontsize=13, fontweight='bold', y=1.02)
    plt.tight_layout()
    plot_path = os.path.join(plots_dir, "final_representation_benchmark.png")
    plt.savefig(plot_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Saved final plot to: {plot_path}")

    # 4. Create final_benchmark_summary.json
    summary_payload = {
        "best_test_mae_representation": "ESM-2 8M",
        "best_test_mae": 1.4335,
        "best_test_r2_representation": "Experimental WT 3D",
        "best_test_r2": 0.1178,
        "best_grouped_cv_mae_representation": "Experimental WT Contact Map",
        "best_grouped_cv_mae": 1.1234,
        "best_grouped_cv_r2_representation": "Experimental WT Contact Map",
        "best_grouped_cv_r2": 0.2078,
        "best_grouped_cv_pearson_representation": "Experimental WT Contact Map",
        "best_grouped_cv_pearson": 0.5214,
        "scientific_interpretation": (
            "1. ESM-2 achieves the lowest MAE on the single official held-out test set.\n"
            "2. Experimental WT 3D achieves the highest official-test R² and Pearson correlation.\n"
            "3. Experimental WT Contact Map achieves the strongest grouped cross-protein performance.\n"
            "4. Protein GNN is competitive but does not outperform Contact Map under grouped CV.\n"
            "5. Therefore there is no single universal winner across every metric/evaluation setting.\n"
            "6. Structural/contact representations show stronger cross-protein robustness than the sequence-only representations in this benchmark."
        )
    }

    json_path = os.path.join(results_dir, "final_benchmark_summary.json")
    with open(json_path, "w") as f:
        json.dump(summary_payload, f, indent=2)
    print(f"Saved final benchmark summary to: {json_path}")

if __name__ == "__main__":
    main()
