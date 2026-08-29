# RepPred — Protein Representation Benchmark

> **RepPred** is a controlled scientific benchmark evaluating how different protein representation paradigms impact mutation-level stability prediction ($\Delta\Delta G$).

---

## 🔬 Scientific Overview & Approach

Protein engineering tasks can be viewed through multiple biological and computational lenses. Instead of arbitrarily choosing a representation or "trying everything," **RepPred** benchmarks representations on a controlled, task-specific basis.

The core prototype task evaluates:
$$\text{Predicting single point mutation effects on protein stability } (\Delta\Delta G \text{ in kcal/mol})$$
$$\text{Convention: } \Delta\Delta G < 0 \text{ (stabilizing)}, \quad \Delta\Delta G > 0 \text{ (destabilizing)}$$

We evaluate **five distinct representation paradigms** using identical mutations, identical ground-truth targets, and strictly controlled evaluation protocols.

---

## 📊 Dataset & Provenance

All evaluations are conducted strictly on authentic experimental measurements from the **FireProt** curated database:

- **Original Dataset**: 3,438 single-point mutations
- **Mapped Benchmark Dataset**: 3,433 experimentally validated mutations across 100 unique wild-type (WT) PDB structures
- **Ground Truth**: Experimentally measured $\Delta\Delta G$ values ($\text{kcal/mol}$)
- **Data Integrity Standards**:
  - **100% Real Experimental Data**: No synthetic sequences, no fabricated $\Delta\Delta G$ labels.
  - **Zero Synthetic Structures**: Authentic WT PDB crystal structures only; zero AlphaFold or ESMFold synthetic coordinates.
  - **Protein-Level Split**: Strict partitioning by UniProt ID across partitions to prevent data leakage:
    - **Train Set**: 2,681 mutations (57 unique UniProt proteins)
    - **Validation Set**: 402 mutations (15 unique UniProt proteins)
    - **Held-Out Test Set**: 350 mutations (28 unique UniProt proteins)
  - **Grouped CV Set**: 3,083 mutations across 72 proteins evaluated via 5-Fold `GroupKFold`.

---

## 🧬 Five Representation Paradigms & Feature Engineering

| Representation Paradigm | Dimension / Architecture | Key Biological Features & Extraction Pipeline |
| :--- | :--- | :--- |
| **1. Hand-Engineered Sequence** | **252D** Vector + Random Forest | Wild-type & mutant residue one-hot encodings, BLOSUM62 substitution matrix score, amino acid physicochemical property deltas ($\Delta\text{hydropathy}$, $\Delta\text{volume}_{\text{vdW}}$, $\Delta\text{charge}$, $\Delta\text{polarity}$), relative chain position, sequence length, and flanking sequence context ($k=5$ window). |
| **2. ESM-2 8M Learned** | **1280D** Latent + Random Forest | Mean-pooled contextual embeddings extracted from pre-trained `esm2_t6_8M_UR50D` Transformer language model, capturing evolutionary co-occurrence and language semantics. |
| **3. Experimental WT 3D** | **131D** Vector + Random Forest | Extracted from authentic experimental WT PDB coordinates: $10\text{ \AA}$ local mass density (`loc_mol_weight_10A`), C$\alpha$ thermal B-factor, backbone dihedral angles ($\phi, \psi$), distance to center of mass, and $k$-nearest neighbor distances. |
| **4. Experimental WT Contact Map** | **107D** Vector + Random Forest | Spatial connectivity network features: $C\alpha\text{--}C\alpha \le 8.0\text{ \AA}$ and $10\text{ \AA}$ contact counts, local contact density, mean molecular weight of contacted residues, and sequence separation distributions (short, medium, and long-range contacts). |
| **5. Experimental WT Protein GNN** | **3-Layer EdgeConv GNN** ($58\text{D} \to 64\text{D}$) | Molecular graph directly constructed from experimental WT coordinates with 58D node features (residue properties, mutation flags, structural descriptors) and 3D edge attributes ($C\alpha\text{--}C\alpha \le 8.0\text{ \AA}$), trained with 3 EdgeConv message-passing layers. |

---

## ⚙️ Parameters & Modeling Specifications

- **Tree-Based Models (Sequence, ESM-2, WT 3D, Contact Map)**:
  - Algorithm: `RandomForestRegressor` (scikit-learn)
  - Hyperparameters: `n_estimators=100`, `max_depth=None`, `min_samples_split=2`, `random_state=42`, `n_jobs=-1`
- **Graph Neural Network (Protein GNN)**:
  - Architecture: 3-Layer EdgeConv ($58\text{D} \to 64\text{D} \to 64\text{D} \to 64\text{D}$), Batch Normalization, ReLU activation, global mean/add pooling, 2-layer MLP head
  - Optimization: Adam optimizer ($\text{lr} = 10^{-3}$, weight decay $= 10^{-4}$), Mean Squared Error (MSE) loss, early stopping on validation MAE.
- **Evaluation Protocols**:
  - **Official Split**: Fixed train/val/test evaluation on $N=350$ held-out test mutations.
  - **Grouped Cross-Validation**: 5-Fold `GroupKFold` grouped strictly by UniProt ID ($N=3,083$), ensuring test proteins in each fold are completely unobserved during training.

---

## 📈 Benchmark Results & Statistical Reasoning

### 1. Official Held-Out Test Set Performance ($N=350$)

| Representation Paradigm | Test MAE ($\text{kcal/mol}$) | Test RMSE ($\text{kcal/mol}$) | Test $R^2$ | Test Pearson $r$ | Test Spearman $\rho$ |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **ESM-2 8M Learned** | **1.4335** | 2.1452 | 0.0999 | 0.3425 | **0.3241** |
| **Experimental WT Protein GNN** | 1.4520 | 2.1421 | 0.1025 | 0.3310 | 0.2813 |
| **Experimental WT 3D** | 1.4532 | **2.1237** | **0.1178** | **0.3534** | 0.2542 |
| **Experimental WT Contact Map** | 1.4638 | 2.1701 | 0.0788 | 0.3095 | 0.2048 |
| **Hand-Engineered Sequence** | 1.5170 | 2.1824 | 0.0684 | 0.2715 | 0.1984 |

### 2. Grouped Cross-Protein Generalization (5-Fold GroupKFold, $N=3,083$)

| Representation Paradigm | Mean CV MAE ($\text{kcal/mol}$) | Mean CV RMSE ($\text{kcal/mol}$) | Mean CV $R^2$ | Mean CV Pearson $r$ | Mean CV Spearman $\rho$ |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Experimental WT Contact Map** | **1.1234 ± 0.1080** | **1.5090 ± 0.1800** | **0.2078 ± 0.1292** | **0.5214 ± 0.1389** | **0.4749 ± 0.1366** |
| **Experimental WT Protein GNN** | 1.1338 ± 0.0604 | 1.5508 ± 0.1241 | 0.1650 ± 0.0475 | 0.4497 ± 0.0955 | 0.4180 ± 0.0848 |
| **Experimental WT 3D** | 1.1474 ± 0.1068 | 1.5465 ± 0.1846 | 0.1720 ± 0.0928 | 0.4953 ± 0.1087 | 0.4472 ± 0.1240 |
| **Hand-Engineered Sequence** | 1.2336 ± 0.0941 | 1.6727 ± 0.1932 | 0.0315 ± 0.0868 | 0.3800 ± 0.0658 | 0.3620 ± 0.0673 |
| **ESM-2 8M Learned** | 1.2347 ± 0.0858 | 1.6185 ± 0.1491 | 0.0913 ± 0.0630 | 0.4018 ± 0.0731 | 0.3615 ± 0.0596 |

### 🔍 Statistical Reasoning & Nuance
1. **Evaluation Context Shapes Performance**:
   - **ESM-2** achieves the lowest MAE ($1.4335\text{ kcal/mol}$) on the single held-out test split, leveraging rich sequence semantics.
   - **Experimental WT Contact Map** achieves the lowest error ($1.1234\text{ kcal/mol}$) and highest Pearson correlation ($r = 0.5214$) across grouped cross-validation folds.
2. **Explicit Topology Enhances Transferability**:
   - Explicit spatial contact networks and local physical environment features (e.g., $10\text{ \AA}$ packing density, B-factors, contact residue mass) provide robust generalization signals when evaluating completely unseen protein topologies.
3. **Task-Specific Benchmarking**:
   - No single representation is universally superior for every setting; benchmarking identifies the optimal representation-to-compute tradeoff for a specific engineering target.

---

## 🛠️ Technology Stack

- **Machine Learning & Graph Deep Learning**:
  - Python 3.10+
  - PyTorch & PyTorch Geometric (`torch_geometric`)
  - Fair-ESM (`esm2_t6_8M_UR50D`)
  - scikit-learn (`RandomForestRegressor`, `GroupKFold`)
  - BioPython (`Bio.PDB` parser)
  - NumPy, Pandas, SciPy
- **Interactive Web Application & Visualization**:
  - React 19, TypeScript, Vite
  - Custom HTML5 Canvas 3D Molecular PDB Viewer (C$\alpha$ trace ribbon & $8.0\text{ \AA}$ contact network)
  - Recharts & Lucide Icons

---

## 👥 Authors

**Sachin Nagenahalli, Nandini Solanki, and Asma Saifudeen**
