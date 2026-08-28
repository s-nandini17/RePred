# `reppred` — Interactive Video & Presentation Walkthrough Script

**Project**: ProtBench / FireProt Protein Representation Benchmark  
**Target Duration**: 2 minutes 30 seconds  
**Target Audience**: Biotechnology Researchers, Machine Learning Scientists, and Scientific Evaluators  
**Primary Dataset**: FireProt DMS Assay ($\Delta\Delta G$ stability change) with 3,433 mapped experimental mutations across 100 wild-type PDB structures.

---

## 🎬 Timeline & Talking Points

### 0:00 – 0:20 | Introduction & Scientific Thesis
* **Visual**: Home Page Hero (`http://127.0.0.1:5173/`)
* **Action**: Slow downward scroll past editorial hero headline *"Proteins can be represented in more than one way"* to the statistics bar.
* **Narration**:
  > *"Welcome to reppred — an interactive benchmark exploring how protein representations impact stability prediction. Predicting mutation-driven stability change ($\Delta\Delta G$) depends heavily on how a model 'sees' a protein. ProtBench evaluates five fundamental representation paradigms using the exact same 3,433 experimental FireProt mutations under strict protein-held-out cross-validation."*

---

### 0:20 – 0:45 | The Five Representation Paradigms
* **Visual**: Home Page — Five Representation Progression Cards
* **Action**: Hover cursor sequentially over the 5 representation cards: Sequence (252D), ESM-2 (1280D), WT 3D (131D), Contact Map (107D), and Protein GNN.
* **Narration**:
  > *"We compare five distinct paradigms: Hand-engineered sequence features (252D), ESM-2 Transformer language embeddings (1280D), Experimental WT 3D local physical structure (131D), Experimental WT Contact Networks (107D), and learned message-passing Graph Neural Networks on physical protein topologies."*

---

### 0:45 – 1:30 | Mutation Explorer & 3D Molecular Centerpiece
* **Visual**: Mutation Explorer Page (`/explore`)
* **Action**: Click **Explore a Mutation**. Select Protein `1PGA` (Protein G) and Mutation `M1A` (Met1Ala, PDB Residue #1). Toggle 3D viewer rotation and 8Å contact edges.
* **Narration**:
  > *"Let's explore a real FireProt mutation: M1A in Protein G (PDB 1PGA). Notice the 3D molecular viewer displaying the authentic experimental wild-type PDB structure. The mutation site at residue 1 is highlighted in glowing green. Following scientific rigor, we never generate or display artificial mutant coordinates. On the right, we see the experimental ground truth $\Delta\Delta G = +1.98\text{ kcal/mol}$ (destabilizing)."*

---

### 1:30 – 1:55 | Representation Switching & Model Predictions
* **Visual**: Representation Switcher Tabs & Prediction Panel
* **Action**: Click through `Sequence 252D`, `ESM-2 1280D`, `WT 3D 131D`, `Contact Map 107D`, and `Protein GNN`. Observe feature values and model predictions.
* **Narration**:
  > *"As we switch representations, the explanatory panel dynamically reveals representation details — from local mass density (10Å sphere) and C$\alpha$ B-factors to 8Å contact neighbor counts. Below, we see saved model predictions across all paradigms alongside exact residual errors."*

---

### 1:55 – 2:15 | Benchmark Leaderboards & Nuanced Scientific Findings
* **Visual**: Benchmark Leaderboard Page (`/benchmark`)
* **Action**: Click **Benchmark**. Highlight the **Official Held-Out Test Leaderboard** ($N=350$) and the **Grouped Cross-Protein Leaderboard** ($N=3,083$).
* **Narration**:
  > *"In our benchmark results, ESM-2 achieves the lowest MAE on the official test set (1.4335 kcal/mol). However, under grouped cross-protein evaluation where test proteins are completely unobserved during training, the Experimental WT Contact Map achieves the strongest performance (MAE 1.1234 ± 0.1080 kcal/mol) and highest Pearson correlation ($r = 0.5214$). Different evaluation settings reveal different strengths across representations."*

---

### 2:15 – 2:30 | Interpretability & Data Provenance
* **Visual**: Interpretability (`/interpretability`) & Data (`/data`)
* **Action**: Click **Interpretability** to view top feature rankings, then click **Data** to highlight the Data Integrity Checklist Panel.
* **Narration**:
  > *"Feature importance rankings show that models rely heavily on local mass density and contact neighborhood mass. Finally, our Data Provenance panel verifies 100% real FireProt experimental data, 0 synthetic data, and 0 protein leakage. Thank you for exploring reppred."*

---

## 🛠️ Presentation Setup & Demo Tips
1. Open `http://127.0.0.1:5173/` in Google Chrome or Safari.
2. Click **`Presentation Mode`** in the top navigation bar to hide developer metadata and enlarge typography for screens or projectors.
3. Use standard browser zoom (100%) and smooth cursor movements.
