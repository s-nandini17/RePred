import os
import pandas as pd

def validate_data_splits():
    train_path = "project/data/fireprot/original_copies/fireprot_train.csv"
    val_path = "project/data/fireprot/original_copies/fireprot_val.csv"
    test_path = "project/data/fireprot/original_copies/fireprot_test.csv"

    print("==================================================")
    print("        FIREPROT SPLIT DATA LEAKAGE AUDIT         ")
    print("==================================================")

    df_train = pd.read_csv(train_path)
    df_val = pd.read_csv(val_path)
    df_test = pd.read_csv(test_path)

    print(f"\n1. SAMPLE COUNTS:")
    print(f"   Train samples:      {len(df_train)}")
    print(f"   Validation samples: {len(df_val)}")
    print(f"   Test samples:       {len(df_test)}")
    print(f"   Total samples:      {len(df_train) + len(df_val) + len(df_test)}")

    # Extract UniProt sets
    train_uniprots = set(df_train['uniprot_id'].dropna().unique())
    val_uniprots = set(df_val['uniprot_id'].dropna().unique())
    test_uniprots = set(df_test['uniprot_id'].dropna().unique())

    print(f"\n2. UNIQUE UNIPROT IDS:")
    print(f"   Train UniProts:      {len(train_uniprots)}")
    print(f"   Validation UniProts: {len(val_uniprots)}")
    print(f"   Test UniProts:       {len(test_uniprots)}")
    print(f"   Total Unique:        {len(train_uniprots | val_uniprots | test_uniprots)}")

    # Extract PDB sets
    train_pdbs = set(df_train['pdb_id_corrected'].dropna().str.upper().unique())
    val_pdbs = set(df_val['pdb_id_corrected'].dropna().str.upper().unique())
    test_pdbs = set(df_test['pdb_id_corrected'].dropna().str.upper().unique())

    print(f"\n3. UNIQUE PDB IDS:")
    print(f"   Train PDBs:          {len(train_pdbs)}")
    print(f"   Validation PDBs:     {len(val_pdbs)}")
    print(f"   Test PDBs:           {len(test_pdbs)}")
    print(f"   Total Unique:        {len(train_pdbs | val_pdbs | test_pdbs)}")

    # Check Overlaps
    train_val_uni_overlap = train_uniprots.intersection(val_uniprots)
    train_test_uni_overlap = train_uniprots.intersection(test_uniprots)
    val_test_uni_overlap = val_uniprots.intersection(test_uniprots)

    train_val_pdb_overlap = train_pdbs.intersection(val_pdbs)
    train_test_pdb_overlap = train_pdbs.intersection(test_pdbs)
    val_test_pdb_overlap = val_pdbs.intersection(test_pdbs)

    print(f"\n4. UNIPROT ID LEAKAGE AUDIT:")
    print(f"   Train <-> Validation Overlap: {len(train_val_uni_overlap)} {list(train_val_uni_overlap)}")
    print(f"   Train <-> Test Overlap:       {len(train_test_uni_overlap)} {list(train_test_uni_overlap)}")
    print(f"   Val   <-> Test Overlap:       {len(val_test_uni_overlap)} {list(val_test_uni_overlap)}")

    print(f"\n5. PDB ID LEAKAGE AUDIT:")
    print(f"   Train <-> Validation Overlap: {len(train_val_pdb_overlap)} {list(train_val_pdb_overlap)}")
    print(f"   Train <-> Test Overlap:       {len(train_test_pdb_overlap)} {list(train_test_pdb_overlap)}")
    print(f"   Val   <-> Test Overlap:       {len(val_test_pdb_overlap)} {list(val_test_pdb_overlap)}")

    print("\n==================================================")
    if len(train_val_uni_overlap) == 0 and len(train_test_uni_overlap) == 0 and len(val_test_uni_overlap) == 0:
        print("   ✅ VERDICT: ZERO DATA LEAKAGE DETECTED!       ")
        print("   Split is strictly partitioned by protein/PDB. ")
    else:
        print("   ⚠️ WARNING: POTENTIAL DATA LEAKAGE DETECTED!   ")
    print("==================================================")

if __name__ == "__main__":
    validate_data_splits()
