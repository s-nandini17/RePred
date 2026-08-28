import os
import pandas as pd
import numpy as np

def inspect_dataset():
    data_path = "project/data/fireprot/original_copies/combined_fireprot.csv"
    train_path = "project/data/fireprot/original_copies/fireprot_train.csv"
    val_path = "project/data/fireprot/original_copies/fireprot_val.csv"
    test_path = "project/data/fireprot/original_copies/fireprot_test.csv"

    print("==================================================")
    print("      FIREPROT BENCHMARK DATASET INSPECTION       ")
    print("==================================================")

    df_comb = pd.read_csv(data_path)
    df_train = pd.read_csv(train_path)
    df_val = pd.read_csv(val_path)
    df_test = pd.read_csv(test_path)

    # 1. Dataset dimensions
    print(f"\n1. DATASET DIMENSIONS:")
    print(f"   Combined Dataset: {df_comb.shape[0]} rows, {df_comb.shape[1]} columns")
    print(f"   Train Split:      {df_train.shape[0]} rows")
    print(f"   Validation Split: {df_val.shape[0]} rows")
    print(f"   Test Split:       {df_test.shape[0]} rows")
    print(f"   Split Sum:        {len(df_train) + len(df_val) + len(df_test)} rows")

    # 2. Key Columns
    print(f"\n2. COLUMNS ({len(df_comb.columns)} total):")
    print(f"   {list(df_comb.columns)}")

    # 3. Missing values check
    print(f"\n3. MISSING VALUES IN KEY FIELDS:")
    key_cols = ['experiment_id', 'protein_name', 'uniprot_id', 'pdb_id_corrected', 'chain', 'position', 'wild_type', 'mutation', 'ddG', 'sequence', 'split']
    for c in key_cols:
        if c in df_comb.columns:
            missing = df_comb[c].isnull().sum()
            print(f"   Field '{c:<20}': {missing} missing values")
        else:
            print(f"   Field '{c:<20}': NOT FOUND IN CSV")

    # 4. Target Statistics
    ddG = df_comb['ddG']
    print(f"\n4. TARGET (ddG) STATISTICS:")
    print(f"   Total Non-null: {len(ddG.dropna())} / {len(df_comb)}")
    print(f"   Minimum:   {ddG.min():.4f} kcal/mol")
    print(f"   Maximum:   {ddG.max():.4f} kcal/mol")
    print(f"   Mean:      {ddG.mean():.4f} kcal/mol")
    print(f"   Median:    {ddG.median():.4f} kcal/mol")
    print(f"   Std Dev:   {ddG.std():.4f} kcal/mol")

    # 5. Unique Proteins & PDBs
    print(f"\n5. UNIQUE PROTEINS & PDBS:")
    print(f"   Unique UniProt IDs: {df_comb['uniprot_id'].nunique()}")
    print(f"   Unique PDB IDs:     {df_comb['pdb_id_corrected'].nunique()}")

    # 6. Mutation & Sequence Validation
    standard_aas = set("ACDEFGHIKLMNPQRSTVWY")
    seq_matches = 0
    seq_mismatches = 0
    invalid_wts = 0
    invalid_muts = 0
    mismatch_records = []

    for idx, row in df_comb.iterrows():
        wt = str(row['wild_type']).strip()
        mut = str(row['mutation']).strip()
        pos = row['position']
        seq = str(row['sequence']).strip()

        if wt not in standard_aas:
            invalid_wts += 1
        if mut not in standard_aas:
            invalid_muts += 1

        if pd.notna(pos):
            p_idx = int(pos) - 1  # 1-based biological indexing
            if 0 <= p_idx < len(seq):
                if seq[p_idx] == wt:
                    seq_matches += 1
                else:
                    seq_mismatches += 1
                    mismatch_records.append((row['experiment_id'], wt, pos, seq[p_idx] if p_idx < len(seq) else 'OOB'))
            else:
                seq_mismatches += 1
                mismatch_records.append((row['experiment_id'], wt, pos, 'OUT_OF_BOUNDS'))

    print(f"\n6. SEQUENCE & MUTATION VALIDATION:")
    print(f"   Total Mutations Checked: {len(df_comb)}")
    print(f"   Invalid Wild-Type AAs:  {invalid_wts}")
    print(f"   Invalid Mutant AAs:     {invalid_muts}")
    print(f"   Wild-Type Sequence Matches (1-based position):    {seq_matches} / {len(df_comb)} ({seq_matches/len(df_comb)*100:.2f}%)")
    print(f"   Wild-Type Sequence Mismatches (1-based position): {seq_mismatches}")

    if seq_mismatches > 0:
        print(f"   WARNING: Sample Mismatches: {mismatch_records[:5]}")

    print("\n==================================================")
    print("            INSPECTION COMPLETE                  ")
    print("==================================================")

if __name__ == "__main__":
    inspect_dataset()
