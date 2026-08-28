import os
import sys
import torch
import pandas as pd
import numpy as np

# Ensure src modules are in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.data.dataset import FireProtDataset
from src.representations.esm import ESMRepresentationExtractor

def extract_and_cache_esm_embeddings():
    print("==================================================")
    print("  MILESTONE 2: ESM-2 8M EMBEDDING EXTRACTION & CACHE  ")
    print("==================================================")

    results_dir = "results"
    os.makedirs(results_dir, exist_ok=True)
    cache_path = os.path.join(results_dir, "esm_embeddings_8m.pt")

    # 1. Load Real Data
    print("\n--- STEP 1: Loading Real FireProt Data ---")
    dataset = FireProtDataset(data_dir="project/data/fireprot/original_copies")
    df_comb = dataset.get_split("combined")

    print(f"Total mutations to process: {len(df_comb)}")

    # 2. Verify Wild-Type Residues & Construct Deterministic Mutant Sequences
    print("\n--- STEP 2: Verifying Sequence Positions & Constructing Mutant Sequences ---")
    wt_seq_map = {} # uniprot_id -> WT sequence
    mutant_seq_map = {} # (uniprot_id, pos, mut) -> mutant sequence
    
    match_count = 0
    mismatch_count = 0

    for idx, row in df_comb.iterrows():
        wt = str(row['wild_type']).strip()
        mut = str(row['mutation']).strip()
        pos = int(row['position']) # 1-based index
        seq = str(row['sequence']).strip()
        u_id = str(row['uniprot_id']).strip()

        # Sanity Check: sequence[pos - 1] == wild_type
        if 1 <= pos <= len(seq):
            if seq[pos - 1] == wt:
                match_count += 1
            else:
                mismatch_count += 1
                raise ValueError(f"🚨 FATAL: Row {idx} ({row['experiment_id']}) wild_type '{wt}' does not match sequence[{pos-1}] ('{seq[pos-1]}')!")
        else:
            raise ValueError(f"🚨 FATAL: Row {idx} position {pos} is out of bounds for sequence of length {len(seq)}!")

        wt_seq_map[u_id] = seq

        # Deterministic Mutant Sequence Construction
        seq_chars = list(seq)
        seq_chars[pos - 1] = mut
        mut_seq = "".join(seq_chars)
        mutant_seq_map[(u_id, pos, mut)] = mut_seq

    print(f"Wild-Type residue matches: {match_count} / {len(df_comb)} (100.00%)")
    print(f"Unique WT sequences:      {len(wt_seq_map)}")
    print(f"Unique Mutant sequences:  {len(mutant_seq_map)}")

    # 3. Load Frozen ESM-2 8M Extractor
    print("\n--- STEP 3: Loading Frozen ESM-2 8M Extractor ---")
    extractor = ESMRepresentationExtractor()

    # 4. Extract & Cache WT Embeddings
    print(f"\n--- STEP 4: Extracting Embeddings for {len(wt_seq_map)} Unique WT Sequences ---")
    wt_embeddings_cache = {} # u_id -> (token_rep, mean_emb)
    for u_idx, (u_id, seq) in enumerate(wt_seq_map.items()):
        token_rep, mean_emb = extractor.extract_sequence_embedding(seq)
        wt_embeddings_cache[u_id] = {
            "token_rep": token_rep,
            "mean_emb": mean_emb,
            "seq_len": len(seq)
        }
        if (u_idx + 1) % 25 == 0 or (u_idx + 1) == len(wt_seq_map):
            print(f"  Processed {u_idx+1}/{len(wt_seq_map)} WT sequences...")

    # 5. Extract & Cache Mutant Embeddings
    print(f"\n--- STEP 5: Extracting Embeddings for {len(mutant_seq_map)} Unique Mutant Sequences ---")
    mut_embeddings_cache = {} # (u_id, pos, mut) -> (token_rep, mean_emb)
    mut_keys = list(mutant_seq_map.keys())
    for m_idx, key in enumerate(mut_keys):
        mut_seq = mutant_seq_map[key]
        token_rep, mean_emb = extractor.extract_sequence_embedding(mut_seq)
        mut_embeddings_cache[key] = {
            "token_rep": token_rep,
            "mean_emb": mean_emb,
            "seq_len": len(mut_seq)
        }
        if (m_idx + 1) % 500 == 0 or (m_idx + 1) == len(mut_keys):
            print(f"  Processed {m_idx+1}/{len(mut_keys)} Mutant sequences...")

    # 6. Save Embedding Cache File
    print(f"\n--- STEP 6: Saving Embedding Cache to {cache_path} ---")
    cache_payload = {
        "model_name": "esm2_t6_8M_UR50D",
        "model_checkpoint": extractor.checkpoint_path,
        "hidden_dim": extractor.hidden_dim,
        "wt_embeddings": wt_embeddings_cache,
        "mut_embeddings": mut_embeddings_cache,
        "n_unique_wt": len(wt_seq_map),
        "n_unique_mut": len(mutant_seq_map),
        "n_total_mutations": len(df_comb)
    }

    torch.save(cache_payload, cache_path)
    file_size_mb = os.path.getsize(cache_path) / 1e6
    print(f"Saved ESM-2 8M cache successfully! Cache size: {file_size_mb:.2f} MB")
    print("==================================================")

if __name__ == "__main__":
    extract_and_cache_esm_embeddings()
