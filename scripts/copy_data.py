import os
import shutil
import glob
import pandas as pd

def copy_fireprot_data():
    source_dir = "/Users/a2251/Desktop/hack_data/fireprot_upload"
    target_base = "project/data/fireprot"
    target_copies = os.path.join(target_base, "original_copies")
    target_pdbs = os.path.join(target_base, "pdbs")

    os.makedirs(target_copies, exist_ok=True)
    os.makedirs(target_pdbs, exist_ok=True)

    print("=== STEP 1: Copying CSV files ===")
    csv_source_dir = os.path.join(source_dir, "csvs")
    csv_files = {
        os.path.join(csv_source_dir, "combined_fireprot.csv"): os.path.join(target_copies, "combined_fireprot.csv"),
        os.path.join(csv_source_dir, "4_fireprotDB_bestpH.csv"): os.path.join(target_copies, "4_fireprotDB_bestpH.csv"),
        os.path.join(csv_source_dir, "splits/fireprot_train.csv"): os.path.join(target_copies, "fireprot_train.csv"),
        os.path.join(csv_source_dir, "splits/fireprot_val.csv"): os.path.join(target_copies, "fireprot_val.csv"),
        os.path.join(csv_source_dir, "splits/fireprot_test.csv"): os.path.join(target_copies, "fireprot_test.csv"),
        os.path.join(csv_source_dir, "splits/fireprot_homologue_free.csv"): os.path.join(target_copies, "fireprot_homologue_free.csv"),
    }

    for src, dst in csv_files.items():
        if os.path.exists(src):
            shutil.copy2(src, dst)
            print(f"Copied {os.path.basename(src)} -> {dst} ({os.path.getsize(dst)} bytes)")
        else:
            print(f"WARNING: Source file missing: {src}")

    print("\n=== STEP 2: Copying PDB files ===")
    pdb_source_dir = os.path.join(source_dir, "pdbs")
    pdb_files = glob.glob(os.path.join(pdb_source_dir, "*.pdb"))
    print(f"Found {len(pdb_files)} PDB files in source.")

    for p in pdb_files:
        dst = os.path.join(target_pdbs, os.path.basename(p))
        shutil.copy2(p, dst)

    copied_pdbs = glob.glob(os.path.join(target_pdbs, "*.pdb"))
    print(f"Copied {len(copied_pdbs)} PDB files to {target_pdbs}")

    print("\n=== STEP 3: Verifying Data Integrity & Row Counts ===")
    combined_src = pd.read_csv(os.path.join(csv_source_dir, "combined_fireprot.csv"))
    combined_dst = pd.read_csv(os.path.join(target_copies, "combined_fireprot.csv"))

    train_dst = pd.read_csv(os.path.join(target_copies, "fireprot_train.csv"))
    val_dst = pd.read_csv(os.path.join(target_copies, "fireprot_val.csv"))
    test_dst = pd.read_csv(os.path.join(target_copies, "fireprot_test.csv"))

    print(f"Original combined_fireprot rows: {len(combined_src)}")
    print(f"Copied combined_fireprot rows:   {len(combined_dst)}")
    print(f"Copied train rows: {len(train_dst)}")
    print(f"Copied val rows:   {len(val_dst)}")
    print(f"Copied test rows:  {len(test_dst)}")
    print(f"Total split sum:   {len(train_dst) + len(val_dst) + len(test_dst)}")

    assert len(combined_src) == len(combined_dst) == 3438, "Row count mismatch in combined dataset!"
    assert len(train_dst) == 2686, f"Expected 2686 train rows, got {len(train_dst)}"
    assert len(val_dst) == 402, f"Expected 402 val rows, got {len(val_dst)}"
    assert len(test_dst) == 350, f"Expected 350 test rows, got {len(test_dst)}"

    print("\n✅ DATA COPY & VERIFICATION SUCCESSFUL!")

if __name__ == "__main__":
    copy_fireprot_data()
