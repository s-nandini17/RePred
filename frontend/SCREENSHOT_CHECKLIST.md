# `reppred` — Presentation & Publication Screenshot Checklist

This checklist specifies the required screenshot captures for paper publications, slides, and demonstration documentation.

---

## 📸 Required Screenshot Capture List

### 1. Screenshot 1 — Home Hero Section
- **File Name**: `screenshot_01_hero.png`
- **Route**: `/` (`http://127.0.0.1:5173/`)
- **Focus**: Mandrake-inspired headline *"Proteins can be represented in more than one way"*, ProtBench badge, statistics bar (3,433 mutations, 100 WT PDBs, 5 paradigms), and primary CTA buttons.

### 2. Screenshot 2 — Five Representation Progression
- **File Name**: `screenshot_02_representations.png`
- **Route**: `/` (Scrolled to Five Representation System)
- **Focus**: Progression cards from Sequence (252D) to ESM-2 (1280D), WT 3D (131D), Contact Map (107D), and Protein GNN.

### 3. Screenshot 3 — Research Question & Core Story
- **File Name**: `screenshot_03_research_story.png`
- **Route**: `/` (Scrolled to Research Question section)
- **Focus**: *"How should a model read a protein?"* editorial section and core story card.

### 4. Screenshot 4 — Mutation Explorer Grid
- **File Name**: `screenshot_04_explorer.png`
- **Route**: `/explore`
- **Focus**: Real protein selector (`1PGA`), mutation selector (`M1A`), 3D WT molecular structure viewer, mutation details card, and prediction panel.

### 5. Screenshot 5 — 3D Molecular Centerpiece (Experimental WT)
- **File Name**: `screenshot_05_wt_3d_viewer.png`
- **Route**: `/explore` (Zoomed on 3D Canvas viewer)
- **Focus**: Experimental WT PDB structure, **`EXPERIMENTAL WT STRUCTURE`** badge, C$\alpha$ trace ribbon, 8Å contact edges, and glowing green **`MUTATION SITE`** callout label.

### 6. Screenshot 6 — Representation Detail Panels & Switcher
- **File Name**: `screenshot_06_representation_panels.png`
- **Route**: `/explore` (Tab active on `WT 3D (131D)` or `Contact Map (107D)`)
- **Focus**: Feature breakdown cards (10Å mass density, B-factor, contact count, sequence separation).

### 7. Screenshot 7 — Official Held-Out Test Leaderboard
- **File Name**: `screenshot_07_test_benchmark.png`
- **Route**: `/benchmark`
- **Focus**: Test leaderboard cards ($N=350$) highlighting ESM-2 best test MAE (`1.4335 kcal/mol`).

### 8. Screenshot 8 — Grouped Cross-Protein CV Leaderboard & Table
- **File Name**: `screenshot_08_cv_benchmark.png`
- **Route**: `/benchmark` (Scrolled to Grouped CV section & table)
- **Focus**: Grouped CV leaderboard ($N=3,083$) highlighting Contact Map best cross-protein MAE (`1.1234 ± 0.1080 kcal/mol`) and complete frozen benchmark table.

### 9. Screenshot 9 — Interpretability & Data Provenance Checklist
- **File Name**: `screenshot_09_interpretability_data.png`
- **Route**: `/interpretability` & `/data`
- **Focus**: Top feature reliance charts, caution warning banner, data provenance pipeline, and Data Integrity Audit Checklist (0 synthetic data, 0 AlphaFold).

---

## 📐 Image Quality Standards
- Resolution: Minimum 1920x1080 (HD / Retina 2x scale).
- Browser UI: Clean presentation state (`Presentation Mode ON`).
- Background: Dark background (`#070b12`).
- Format: PNG or lossless WebP.
