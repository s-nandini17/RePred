import os
import sys
import json
import glob
import pandas as pd
import numpy as np
from Bio.PDB import PDBParser, PPBuilder
from Bio.Align import PairwiseAligner
from Bio.SeqUtils import seq1

# Ensure src modules are in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.data.dataset import FireProtDataset

THREE_TO_ONE = {
    'ALA': 'A', 'CYS': 'C', 'ASP': 'D', 'GLU': 'E', 'PHE': 'F',
    'GLY': 'G', 'HIS': 'H', 'ILE': 'I', 'LYS': 'K', 'LEU': 'L',
    'MET': 'M', 'ASN': 'N', 'PRO': 'P', 'GLN': 'Q', 'ARG': 'R',
    'SER': 'S', 'THR': 'T', 'VAL': 'V', 'TRP': 'W', 'TYR': 'Y',
    'MSE': 'M' # Selenomethionine
}

def parse_pdb_chain_residues(pdb_path, chain_id):
    """
    Parses a PDB file and returns a list of residue dicts for the specified chain.
    Only considers standard amino acid residues present in ATOM records.
    """
    parser = PDBParser(QUIET=True)
    structure = parser.get_structure("protein", pdb_path)
    model = structure[0]
    
    # Locate target chain (case-insensitive fallback)
    target_chain = None
    for c in model:
        if c.id == chain_id:
            target_chain = c
            break
    if target_chain is None and len(chain_id) == 1:
        # Try matching lower/upper or first chain
        for c in model:
            if c.id.upper() == chain_id.upper():
                target_chain = c
                break
    if target_chain is None and len(model) > 0:
        target_chain = list(model.get_chains())[0]

    residues_info = []
    for res in target_chain:
        resname = res.get_resname().strip()
        # Exclude heteroatoms / water unless MSE
        if res.id[0] != ' ' and resname != 'MSE':
            continue
        if resname not in THREE_TO_ONE:
            continue
        
        aa_one = THREE_TO_ONE[resname]
        resnum = res.id[1]
        icode = res.id[2].strip() # Insertion code if any
        
        # Check atoms
        atom_names = set(a.get_name().strip() for a in res.get_atoms())
        has_ca = 'CA' in atom_names
        has_backbone = all(a in atom_names for a in ['N', 'CA', 'C', 'O'])
        
        # Sidechain check (Glycine has no sidechain atoms except H/CA)
        if aa_one == 'G':
            has_sidechain = has_ca
        else:
            sidechain_atoms = atom_names - {'N', 'CA', 'C', 'O', 'H', 'HA'}
            has_sidechain = len(sidechain_atoms) > 0

        residues_info.append({
            "chain_id": target_chain.id,
            "resnum": resnum,
            "icode": icode,
            "resname": resname,
            "aa_one": aa_one,
            "has_ca": has_ca,
            "has_backbone": has_backbone,
            "has_sidechain": has_sidechain,
            "bio_residue_obj": res
        })

    return residues_info

def align_and_map_positions(canonical_seq, pdb_residues):
    """
    Aligns canonical sequence (FireProt) with PDB chain sequence using PairwiseAligner.
    Returns a dictionary mapping 1-based FireProt sequence position p -> pdb_residue_dict.
    """
    if len(pdb_residues) == 0:
        return {}

    pdb_seq = "".join(r["aa_one"] for r in pdb_residues)
    
    aligner = PairwiseAligner()
    aligner.mode = 'global'
    aligner.match_score = 2
    aligner.mismatch_score = -1
    aligner.open_gap_score = -5
    aligner.extend_gap_score = -0.5

    alignments = aligner.align(canonical_seq, pdb_seq)
    if len(alignments) == 0:
        return {}
    
    best_alignment = alignments[0]
    aligned_canon, aligned_pdb = best_alignment

    mapping = {}
    canon_idx = 0
    pdb_idx = 0

    for c_char, p_char in zip(aligned_canon, aligned_pdb):
        if c_char != '-' and p_char != '-':
            canon_pos = canon_idx + 1 # 1-based index
            mapping[canon_pos] = pdb_residues[pdb_idx]
            canon_idx += 1
            pdb_idx += 1
        elif c_char != '-' and p_char == '-':
            canon_idx += 1
        elif c_char == '-' and p_char != '-':
            pdb_idx += 1

    return mapping

def inspect_and_map_fireprot_pdbs():
    print("==================================================")
    print("  MILESTONE 3A: PDB INSPECTION & SEQUENCE MAPPING  ")
    print("==================================================")

    results_dir = "results"
    os.makedirs(results_dir, exist_ok=True)
    mapping_csv_path = os.path.join(results_dir, "pdb_mapping.csv")
    mapping_config_path = os.path.join(results_dir, "pdb_mapping_config.json")

    # 1. Load Real Data
    print("\n--- STEP 1: Loading FireProt Data & Audit PDB Files ---")
    dataset = FireProtDataset(data_dir="project/data/fireprot/original_copies")
    df_comb = dataset.get_split("combined")

    pdb_dir = "project/data/fireprot/pdbs"
    local_pdb_files = glob.glob(os.path.join(pdb_dir, "*.pdb"))
    local_pdb_ids = set(os.path.splitext(os.path.basename(p))[0].upper() for p in local_pdb_files)

    dataset_pdb_ids = set(df_comb['pdb_id_corrected'].dropna().str.upper().unique())
    unique_uniprots = set(df_comb['uniprot_id'].dropna().unique())

    print(f"Total FireProt mutations:      {len(df_comb)}")
    print(f"Unique UniProt proteins:       {len(unique_uniprots)}")
    print(f"Unique PDB IDs in dataset:     {len(dataset_pdb_ids)}")
    print(f"Local PDB files found:         {len(local_pdb_files)}")

    missing_pdbs = dataset_pdb_ids - local_pdb_ids
    print(f"Missing PDB files:             {len(missing_pdbs)}")
    if missing_pdbs:
        print(f"  Missing IDs: {missing_pdbs}")

    # 2. Inspect Structure Types (WT vs Mutant)
    print("\n--- STEP 2: Inspecting Local Structure Types ---")
    # All 100 PDBs in project/data/fireprot/pdbs correspond to wild-type structures referenced in FireProt
    wt_structures_count = len(dataset_pdb_ids - missing_pdbs)
    mutant_structures_count = 0 # No separate mutant PDB files exist in FireProt dataset
    print(f"Wild-Type structures available: {wt_structures_count}")
    print(f"Mutant structures available:    {mutant_structures_count}")

    # 3. Perform Alignment & Residue Mapping for All 3,438 Mutations
    print("\n--- STEP 3: Mapping FireProt Positions to PDB Residues ---")

    # Cache parsed PDB residues per (pdb_id, chain)
    pdb_chain_cache = {}
    alignment_cache = {} # (uniprot_id, pdb_id, chain) -> mapping dict

    mapping_rows = []

    mapped_count = 0
    unmapped_count = 0
    wt_match_count = 0
    wt_mismatch_count = 0

    ca_avail_count = 0
    backbone_avail_count = 0
    sidechain_avail_count = 0

    resnum_offset_count = 0
    icode_count = 0
    missing_coord_count = 0

    for idx, row in df_comb.iterrows():
        exp_id = row['experiment_id']
        u_id = str(row['uniprot_id']).strip()
        pdb_id = str(row['pdb_id_corrected']).strip().upper()
        chain = str(row['chain']).strip()
        pos = int(row['position']) # 1-based canonical sequence position
        wt = str(row['wild_type']).strip()
        mut = str(row['mutation']).strip()
        seq = str(row['sequence']).strip()

        pdb_file = os.path.join(pdb_dir, f"{pdb_id}.pdb")
        
        status = "UNMAPPED"
        pdb_resnum = None
        pdb_icode = ""
        pdb_resname = None
        pdb_aa_one = None
        ca_avail = False
        backbone_avail = False
        sidechain_avail = False

        if os.path.exists(pdb_file):
            cache_key = (u_id, pdb_id, chain)
            if cache_key not in alignment_cache:
                if (pdb_id, chain) not in pdb_chain_cache:
                    pdb_chain_cache[(pdb_id, chain)] = parse_pdb_chain_residues(pdb_file, chain)
                
                pdb_res_list = pdb_chain_cache[(pdb_id, chain)]
                alignment_cache[cache_key] = align_and_map_positions(seq, pdb_res_list)

            pos_mapping = alignment_cache[cache_key]

            if pos in pos_mapping:
                mapped_res = pos_mapping[pos]
                pdb_resnum = mapped_res["resnum"]
                pdb_icode = mapped_res["icode"]
                pdb_resname = mapped_res["resname"]
                pdb_aa_one = mapped_res["aa_one"]
                ca_avail = mapped_res["has_ca"]
                backbone_avail = mapped_res["has_backbone"]
                sidechain_avail = mapped_res["has_sidechain"]

                if pdb_aa_one == wt:
                    status = "MAPPED_MATCH"
                    wt_match_count += 1
                else:
                    status = "MAPPED_MISMATCH"
                    wt_mismatch_count += 1
                    print(f"  WARNING: Mutation {exp_id} ({u_id} pos {pos}): WT '{wt}' != PDB AA '{pdb_aa_one}'!")

                mapped_count += 1
                if ca_avail: ca_avail_count += 1
                if backbone_avail: backbone_avail_count += 1
                if sidechain_avail: sidechain_avail_count += 1
                if not ca_avail: missing_coord_count += 1
                if pdb_icode != "": icode_count += 1
                if pdb_resnum != pos: resnum_offset_count += 1
            else:
                status = "UNMAPPED_MISSING_RESIDUE"
                unmapped_count += 1
        else:
            status = "UNMAPPED_PDB_MISSING"
            unmapped_count += 1

        mapping_rows.append({
            "experiment_id": exp_id,
            "uniprot_id": u_id,
            "pdb_id": pdb_id,
            "chain": chain,
            "fireprot_position": pos,
            "wild_type": wt,
            "mutation": mut,
            "pdb_residue_number": pdb_resnum,
            "pdb_insertion_code": pdb_icode,
            "pdb_residue_name": pdb_resname,
            "pdb_residue_one_letter": pdb_aa_one,
            "ca_available": ca_avail,
            "backbone_available": backbone_avail,
            "sidechain_available": sidechain_avail,
            "mapping_status": status
        })

    mapping_df = pd.DataFrame(mapping_rows)
    mapping_df.to_csv(mapping_csv_path, index=False)
    print(f"Saved complete PDB mapping to: {mapping_csv_path}")

    # 4. Save Config & Report
    total_mutations = len(df_comb)
    mapping_pct = (mapped_count / total_mutations) * 100.0
    wt_match_pct = (wt_match_count / mapped_count * 100.0) if mapped_count > 0 else 0.0

    config_payload = {
        "mapping_strategy": "Pairwise Sequence Alignment (Bio.Align.PairwiseAligner global mode) between canonical FireProt sequence and PDB ATOM residue sequence",
        "total_mutations": total_mutations,
        "successfully_mapped_mutations": mapped_count,
        "unmapped_mutations": unmapped_count,
        "mapping_success_percentage": round(mapping_pct, 2),
        "wt_residue_agreement_count": wt_match_count,
        "wt_residue_mismatch_count": wt_mismatch_count,
        "wt_residue_agreement_percentage": round(wt_match_pct, 2),
        "ca_coordinate_available": ca_avail_count,
        "backbone_coordinate_available": backbone_avail_count,
        "sidechain_coordinate_available": sidechain_avail_count,
        "residue_number_offset_count": resnum_offset_count,
        "insertion_code_count": icode_count,
        "missing_coordinates_count": missing_coord_count,
        "wt_structures_available": wt_structures_count,
        "mutant_structures_available": mutant_structures_count
    }

    with open(mapping_config_path, "w") as f:
        json.dump(config_payload, f, indent=2)
    print(f"Saved PDB mapping config to: {mapping_config_path}")

    print("\n==================================================")
    print("  MILESTONE 3A: PDB INSPECTION & COVERAGE REPORT  ")
    print("==================================================")
    print(f"Total mutations:            {total_mutations}")
    print(f"Successfully mapped:        {mapped_count} ({mapping_pct:.2f}%)")
    print(f"Unmapped:                  {unmapped_count} ({100.0 - mapping_pct:.2f}%)")
    print(f"WT residue agreement:       {wt_match_count} ({wt_match_pct:.2f}% of mapped)")
    print(f"WT residue mismatches:      {wt_mismatch_count}")
    print(f"C-alpha coordinates avail:  {ca_avail_count} ({ca_avail_count/total_mutations*100:.2f}%)")
    print(f"Backbone coordinates avail: {backbone_avail_count} ({backbone_avail_count/total_mutations*100:.2f}%)")
    print(f"Sidechain coordinates avail:{sidechain_avail_count} ({sidechain_avail_count/total_mutations*100:.2f}%)")
    print(f"PDB residue number offsets: {resnum_offset_count} (mutations where FireProt pos != PDB resnum)")
    print(f"Insertion codes present:    {icode_count}")
    print("==================================================")

if __name__ == "__main__":
    inspect_and_map_fireprot_pdbs()
