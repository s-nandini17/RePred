# Protein Stability Prediction Benchmark — RePred

Research benchmark evaluating protein design representations on experimental $\Delta\Delta G$ prediction.

## Research Objective
Evaluate and compare representation paradigms for protein design tasks:
1. **Hand-Engineered Sequence/Mutation Representation** (Milestone 1 Baseline, 252 Dims)
2. **ESM Learned Protein Representation** (Milestone 2 Baseline, 1,280 Dims)
3. **Experimental WT 3D Structural Representation** (Milestone 3 Baseline, 131 Dims)
4. **Experimental WT Contact Map Representation** (Milestone 5 Baseline, 107 Dims)
5. **Experimental WT Protein Graph + Graph Neural Network** (Milestone 6A Baseline, 58D Node / 3D Edge)

---

## Data Integrity Rules
- **Real Data Only**: Derived strictly from local FireProt experimental dataset in `project/data/fireprot/`.
- **Zero Synthetic Data**: Zero fake mutations, mock sequences, placeholder PDBs, or fabricated $\Delta\Delta G$ labels.
- **Protein-Level Splits**: Strictly partitioned by UniProt ID and PDB ID across Train ($N=2,681$), Validation ($N=402$), and Test ($N=350$) with zero data leakage.

---

## Controlled Representation Benchmark Results ($N=3,433$)

### 1. Official Split Benchmark Results (Fixed Model Selection on Validation Set, $N=350$ Test)

| Representation Paradigm | Feature / Model Architecture | Val MAE ($\text{kcal/mol}$) | Test MAE ($\text{kcal/mol}$) | Test RMSE ($\text{kcal/mol}$) | Test $R^2$ | Test Pearson $r$ | Test Spearman $\rho$ |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Hand-Engineered Sequence** | 252D RandomForest | 1.1091 | 1.5170 | 2.1824 | 0.0684 | 0.2715 | 0.1984 |
| **ESM-2 8M Learned** | 1280D RandomForest | 1.1735 | **1.4335** | 2.1452 | 0.0999 | 0.3425 | **0.3241** |
| **Experimental WT 3D** | 131D RandomForest | 1.1131 | 1.4532 | **2.1237** | **0.1178** | **0.3534** | 0.2542 |
| **Experimental WT Contact Map** | 107D RandomForest | 1.1269 | 1.4638 | 2.1701 | 0.0788 | 0.3095 | 0.2048 |
| **Experimental WT Protein GNN** | 3-Layer EdgeConv ($58\text{D} \to 64\text{D}$) | **1.0678** | 1.4520 | 2.1421 | 0.1025 | 0.3310 | 0.2813 |

---

### 2. Grouped Cross-Protein Robustness Experiment (5-Fold GroupKFold, $N=3,083$)

| Representation Paradigm | Feature / Model Architecture | Mean CV MAE ($\text{kcal/mol}$) | Mean CV RMSE ($\text{kcal/mol}$) | Mean CV $R^2$ | Mean CV Pearson $r$ | Mean CV Spearman $\rho$ |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Hand-Engineered Sequence** | 252D RandomForest | 1.2336 ± 0.0941 | 1.6727 ± 0.1932 | 0.0315 ± 0.0868 | 0.3800 ± 0.0658 | 0.3620 ± 0.0673 |
| **ESM-2 8M Learned** | 1280D RandomForest | 1.2347 ± 0.0858 | 1.6185 ± 0.1491 | 0.0913 ± 0.0630 | 0.4018 ± 0.0731 | 0.3615 ± 0.0596 |
| **Experimental WT 3D** | 131D RandomForest | 1.1474 ± 0.1068 | 1.5465 ± 0.1846 | 0.1720 ± 0.0928 | 0.4953 ± 0.1087 | 0.4472 ± 0.1240 |
| **Experimental WT Contact Map** | **107D RandomForest** | **1.1234 ± 0.1080** | **1.5090 ± 0.1800** | **0.2078 ± 0.1292** | **0.5214 ± 0.1389** | **0.4749 ± 0.1366** |
| **Experimental WT Protein GNN** | 3-Layer EdgeConv ($58\text{D} \to 64\text{D}$) | 1.1338 ± 0.0604 | 1.5508 ± 0.1241 | 0.1650 ± 0.0475 | 0.4497 ± 0.0955 | 0.4180 ± 0.0848 |

---

## Key Findings (Milestones 1–6A)
1. **Lowest Validation MAE**: **Protein GNN** achieves the overall lowest Validation MAE (**`1.0678 kcal/mol`**) on the official split.
2. **Cross-Protein Generalization**: **Experimental WT Contact Map (107D)** retains the lowest mean Cross-Validation MAE (**`1.1234 kcal/mol`**) and highest Pearson correlation (**`r = 0.5214`**) across unseen proteins in 5-fold grouped CV.
3. **Robustness Variance**: **Protein GNN** exhibits the lowest performance variance across cross-protein folds ($\pm 0.0604$ MAE), indicating stable message passing behavior across diverse structural topologies.

---

## Generated Artifacts & Visualizations
- PyTorch GNN Architecture: [`src/models/protein_gnn.py`](file:///Users/a2251/Desktop/hack_demo1/src/models/protein_gnn.py)
- Protein GNN Training Script: [`scripts/train_protein_gnn.py`](file:///Users/a2251/Desktop/hack_demo1/scripts/train_protein_gnn.py)
- Contact Map Extractor: [`src/representations/contact_map.py`](file:///Users/a2251/Desktop/hack_demo1/src/representations/contact_map.py)
- Benchmark Data Files:
  - [`results/protein_gnn_predictions.csv`](file:///Users/a2251/Desktop/hack_demo1/results/protein_gnn_predictions.csv)
  - [`results/protein_gnn_metrics.json`](file:///Users/a2251/Desktop/hack_demo1/results/protein_gnn_metrics.json)
  - [`results/protein_gnn_grouped_cv.csv`](file:///Users/a2251/Desktop/hack_demo1/results/protein_gnn_grouped_cv.csv)
  - [`results/representation_benchmark.csv`](file:///Users/a2251/Desktop/hack_demo1/results/representation_benchmark.csv)
  - [`results/grouped_cv_comparison.csv`](file:///Users/a2251/Desktop/hack_demo1/results/grouped_cv_comparison.csv)
- Generated Plots:
  - [`results/plots/protein_gnn_predicted_vs_experimental.png`](file:///Users/a2251/Desktop/hack_demo1/results/plots/protein_gnn_predicted_vs_experimental.png)
  - [`results/plots/protein_gnn_residual_distribution.png`](file:///Users/a2251/Desktop/hack_demo1/results/plots/protein_gnn_residual_distribution.png)
  - [`results/plots/protein_gnn_training_curve.png`](file:///Users/a2251/Desktop/hack_demo1/results/plots/protein_gnn_training_curve.png)
