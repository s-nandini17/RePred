import os
import math
import numpy as np
import pandas as pd
from Bio.PDB import PDBParser

AA_LIST = ['A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'Y']
AA_TO_IDX = {aa: i for i, aa in enumerate(AA_LIST)}

THREE_TO_ONE = {
    'ALA': 'A', 'CYS': 'C', 'ASP': 'D', 'GLU': 'E', 'PHE': 'F',
    'GLY': 'G', 'HIS': 'H', 'ILE': 'I', 'LYS': 'K', 'LEU': 'L',
    'MET': 'M', 'ASN': 'N', 'PRO': 'P', 'GLN': 'Q', 'ARG': 'R',
    'SER': 'S', 'THR': 'T', 'VAL': 'V', 'TRP': 'W', 'TYR': 'Y',
    'MSE': 'M'
}

# Physicochemical property tables
KYTE_DOOLITTLE = {
    'A': 1.8, 'C': 2.5, 'D': -3.5, 'E': -3.5, 'F': 2.8, 'G': -0.4, 'H': -3.2, 'I': 4.5,
    'K': -3.9, 'L': 3.8, 'M': 1.9, 'N': -3.5, 'P': -1.6, 'Q': -3.5, 'R': -4.5, 'S': -0.8,
    'T': -0.7, 'V': 4.2, 'W': -0.9, 'Y': -1.3
}

VDW_VOLUME = {
    'A': 88.6, 'C': 108.5, 'D': 111.1, 'E': 138.4, 'F': 189.9, 'G': 60.1, 'H': 153.2, 'I': 166.7,
    'K': 168.6, 'L': 166.7, 'M': 162.9, 'N': 114.1, 'P': 112.7, 'Q': 143.8, 'R': 173.4, 'S': 89.0,
    'T': 116.1, 'V': 140.0, 'W': 227.8, 'Y': 193.6
}

FORMAL_CHARGE = {
    'A': 0, 'C': 0, 'D': -1, 'E': -1, 'F': 0, 'G': 0, 'H': 0.5, 'I': 0,
    'K': 1, 'L': 0, 'M': 0, 'N': 0, 'P': 0, 'Q': 0, 'R': 1, 'S': 0,
    'T': 0, 'V': 0, 'W': 0, 'Y': 0
}

POLARITY = {
    'A': 0, 'C': 0, 'D': 1, 'E': 1, 'F': 0, 'G': 0, 'H': 1, 'I': 0,
    'K': 1, 'L': 0, 'M': 0, 'N': 1, 'P': 0, 'Q': 1, 'R': 1, 'S': 1,
    'T': 1, 'V': 0, 'W': 0, 'Y': 1
}

MOL_WEIGHT = {
    'A': 89.1, 'C': 121.2, 'D': 133.1, 'E': 147.1, 'F': 165.2, 'G': 75.1, 'H': 155.2, 'I': 131.2,
    'K': 146.2, 'L': 131.2, 'M': 149.2, 'N': 132.1, 'P': 115.1, 'Q': 146.1, 'R': 174.2, 'S': 105.1,
    'T': 119.1, 'V': 117.1, 'W': 204.2, 'Y': 181.2
}

CONTACT_MAP_FEATURE_NAMES = [
    # 1. Contact Counts & Network Features (11)
    "contact_count_6A",
    "contact_count_8A",
    "contact_count_10A",
    "contact_count_local_seq_le4",
    "contact_count_med_seq_5_10",
    "contact_count_long_seq_gt10",
    "contact_count_long_seq_gt20",
    "contact_ratio_long_to_total",
    "local_contact_density_8A",
    "mean_contact_distance_8A",
    "std_contact_distance_8A",
    
    # 2. Sequence Separation Stats (5)
    "mean_seq_separation_8A",
    "median_seq_separation_8A",
    "max_seq_separation_8A",
    "min_seq_separation_8A",
    "std_seq_separation_8A",
    
    # 3. Contacted AA Counts (20)
    *[f"contact_aa_count_{aa}" for aa in AA_LIST],
    
    # 4. Contacted AA Proportions (20)
    *[f"contact_aa_prop_{aa}" for aa in AA_LIST],
    
    # 5. Contacted Physicochemical Summary (6)
    "contact_mean_kyte_doolittle",
    "contact_mean_vdw_volume",
    "contact_mean_formal_charge",
    "contact_mean_polarity",
    "contact_mean_mol_weight",
    "contact_total_charge",
    
    # 6. Mutation Info: WT (20) + MUT (20) + Deltas (5) = 45
    *[f"wt_is_{aa}" for aa in AA_LIST],
    *[f"mut_is_{aa}" for aa in AA_LIST],
    "delta_kyte_doolittle",
    "delta_vdw_volume",
    "delta_formal_charge",
    "delta_polarity",
    "delta_mol_weight"
]

class ExperimentalWTContactMapExtractor:
    """
    Extracts 107-dimensional mutation-centered contact-map features from real local experimental WT PDB files.
    Primary contact definition: Cα-Cα distance <= 8.0 Å (excluding self-contacts).
    Strictly verifies matrix symmetry C(i,j) == C(j,i) and zero diagonal C(i,i) == 0.
    """
    def __init__(self, pdb_dir="project/data/fireprot/pdbs", primary_threshold=8.0):
        self.pdb_dir = pdb_dir
        self.primary_threshold = primary_threshold
        self.parser = PDBParser(QUIET=True)
        self.pdb_cache = {}

    def get_structure(self, pdb_id):
        pdb_id_upper = pdb_id.upper()
        if pdb_id_upper not in self.pdb_cache:
            pdb_path = os.path.join(self.pdb_dir, f"{pdb_id_upper}.pdb")
            if not os.path.exists(pdb_path):
                raise FileNotFoundError(f"PDB file missing: {pdb_path}")
            struct = self.parser.get_structure(pdb_id_upper, pdb_path)
            self.pdb_cache[pdb_id_upper] = struct
        return self.pdb_cache[pdb_id_upper]

    def extract_contact_map_features_for_row(self, row):
        """
        Extracts 107-dimensional contact-map features for a single mapped FireProt mutation row.
        Returns (feature_dict, audit_dict).
        """
        pdb_id = str(row['pdb_id']).strip().upper()
        chain_id = str(row['chain']).strip()
        resnum = int(row['pdb_residue_number'])
        icode = str(row['pdb_insertion_code']).strip() if pd.notna(row['pdb_insertion_code']) else ''
        wt_aa = str(row['wild_type']).strip().upper()
        mut_aa = str(row['mutation']).strip().upper()

        struct = self.get_structure(pdb_id)
        model = struct[0]

        target_chain = None
        for c in model:
            if c.id == chain_id or c.id.upper() == chain_id.upper():
                target_chain = c
                break
        if target_chain is None:
            target_chain = list(model.get_chains())[0]

        chain = target_chain

        # Filter valid residues with Cα atoms
        valid_residues = []
        for r in chain.get_residues():
            if (r.id[0] == ' ' or r.get_resname().strip() == 'MSE') and 'CA' in r:
                valid_residues.append(r)

        N = len(valid_residues)
        if N == 0:
            raise ValueError(f"No Cα atoms found in chain {chain_id} of PDB {pdb_id}")

        # Compute full Cα distance matrix N x N
        ca_coords = np.array([r['CA'].get_coord() for r in valid_residues], dtype=np.float64)
        diffs = ca_coords[:, np.newaxis, :] - ca_coords[np.newaxis, :, :]
        dist_matrix = np.sqrt(np.sum(diffs ** 2, axis=-1))

        # Verification 1: Non-negative distances
        if np.any(dist_matrix < 0.0):
            raise ValueError(f"Negative Euclidean distance detected in PDB {pdb_id}!")

        # Verification 2: Distance matrix symmetry check |D_ij - D_ji| == 0
        sym_diff = np.max(np.abs(dist_matrix - dist_matrix.T))
        if sym_diff > 1e-5:
            raise ValueError(f"Distance matrix symmetry violation in PDB {pdb_id}: max diff {sym_diff}")

        # Verification 3: Zero diagonal check
        diag_max = np.max(np.abs(np.diag(dist_matrix)))
        if diag_max > 1e-5:
            raise ValueError(f"Non-zero diagonal in distance matrix for PDB {pdb_id}: max diag {diag_max}")

        # Construct primary binary contact matrix C (8.0 Å)
        contact_matrix = ((dist_matrix <= self.primary_threshold) & (~np.eye(N, dtype=bool))).astype(int)

        # Verification 4: Contact matrix symmetry check C(i,j) == C(j,i)
        if not np.array_equal(contact_matrix, contact_matrix.T):
            raise ValueError(f"Contact matrix symmetry violation in PDB {pdb_id}!")

        # Verification 5: Zero diagonal check for contact matrix C(i,i) == 0
        if np.any(np.diag(contact_matrix) != 0):
            raise ValueError(f"Self-contact detected on contact matrix diagonal in PDB {pdb_id}!")

        # Find target mutation residue index in valid_residues
        target_idx = None
        for idx, r in enumerate(valid_residues):
            if r.id[1] == resnum and r.id[2].strip() == icode:
                target_idx = idx
                break

        if target_idx is None:
            raise KeyError(f"Residue {resnum}{icode} not found in chain {chain_id} of PDB {pdb_id}")

        # Extract distances from target residue to all other residues (excluding self)
        target_distances = dist_matrix[target_idx]
        other_indices = [j for j in range(N) if j != target_idx]

        # Neighbors within distance thresholds (excluding self)
        neighbors_6A = [j for j in other_indices if target_distances[j] <= 6.0]
        neighbors_8A = [j for j in other_indices if target_distances[j] <= 8.0] # Primary contacts
        neighbors_10A = [j for j in other_indices if target_distances[j] <= 10.0]

        # Primary 8.0 Å contact neighborhood analysis
        contact_distances_8A = [target_distances[j] for j in neighbors_8A]
        seq_separations_8A = [abs(target_idx - j) for j in neighbors_8A]

        # Sequence separation categorization for 8Å contacts
        local_seq_le4 = [j for j in neighbors_8A if abs(target_idx - j) <= 4]
        med_seq_5_10 = [j for j in neighbors_8A if 5 <= abs(target_idx - j) <= 10]
        long_seq_gt10 = [j for j in neighbors_8A if abs(target_idx - j) > 10]
        long_seq_gt20 = [j for j in neighbors_8A if abs(target_idx - j) > 20]

        n_contacts_8A = len(neighbors_8A)
        ratio_long = len(long_seq_gt10) / float(n_contacts_8A) if n_contacts_8A > 0 else 0.0
        
        # Volume of 8Å sphere = 4/3 * pi * 8^3 = 2144.6605847418543 Å^3
        sphere_vol_8A = (4.0 / 3.0) * math.pi * (8.0 ** 3)
        density_8A = n_contacts_8A / sphere_vol_8A

        mean_dist_8A = float(np.mean(contact_distances_8A)) if n_contacts_8A > 0 else 0.0
        std_dist_8A = float(np.std(contact_distances_8A)) if n_contacts_8A > 0 else 0.0

        mean_seq_sep = float(np.mean(seq_separations_8A)) if n_contacts_8A > 0 else 0.0
        median_seq_sep = float(np.median(seq_separations_8A)) if n_contacts_8A > 0 else 0.0
        max_seq_sep = float(np.max(seq_separations_8A)) if n_contacts_8A > 0 else 0.0
        min_seq_sep = float(np.min(seq_separations_8A)) if n_contacts_8A > 0 else 0.0
        std_seq_sep = float(np.std(seq_separations_8A)) if n_contacts_8A > 0 else 0.0

        # Contacting residue amino-acid identities (3-letter to 1-letter)
        contact_aa_letters = []
        for j in neighbors_8A:
            r_name = valid_residues[j].get_resname().strip()
            aa1 = THREE_TO_ONE.get(r_name, 'A')
            contact_aa_letters.append(aa1)

        aa_counts = {aa: 0 for aa in AA_LIST}
        for aa1 in contact_aa_letters:
            if aa1 in aa_counts:
                aa_counts[aa1] += 1

        aa_props = {aa: (aa_counts[aa] / float(n_contacts_8A) if n_contacts_8A > 0 else 0.0) for aa in AA_LIST}

        # Contacted residue physicochemical properties
        if n_contacts_8A > 0:
            mean_kd = float(np.mean([KYTE_DOOLITTLE.get(aa, 0.0) for aa in contact_aa_letters]))
            mean_vdw = float(np.mean([VDW_VOLUME.get(aa, 100.0) for aa in contact_aa_letters]))
            mean_charge = float(np.mean([FORMAL_CHARGE.get(aa, 0.0) for aa in contact_aa_letters]))
            mean_polar = float(np.mean([POLARITY.get(aa, 0.0) for aa in contact_aa_letters]))
            mean_mw = float(np.mean([MOL_WEIGHT.get(aa, 100.0) for aa in contact_aa_letters]))
            total_charge = float(np.sum([FORMAL_CHARGE.get(aa, 0.0) for aa in contact_aa_letters]))
        else:
            mean_kd, mean_vdw, mean_charge, mean_polar, mean_mw, total_charge = 0.0, 0.0, 0.0, 0.0, 0.0, 0.0

        # Mutation info (WT, MUT identity one-hot & property deltas)
        wt_onehot = {f"wt_is_{aa}": (1.0 if wt_aa == aa else 0.0) for aa in AA_LIST}
        mut_onehot = {f"mut_is_{aa}": (1.0 if mut_aa == aa else 0.0) for aa in AA_LIST}

        delta_kd = KYTE_DOOLITTLE.get(mut_aa, 0.0) - KYTE_DOOLITTLE.get(wt_aa, 0.0)
        delta_vdw = VDW_VOLUME.get(mut_aa, 0.0) - VDW_VOLUME.get(wt_aa, 0.0)
        delta_charge = FORMAL_CHARGE.get(mut_aa, 0.0) - FORMAL_CHARGE.get(wt_aa, 0.0)
        delta_polar = POLARITY.get(mut_aa, 0.0) - POLARITY.get(wt_aa, 0.0)
        delta_mw = MOL_WEIGHT.get(mut_aa, 0.0) - MOL_WEIGHT.get(wt_aa, 0.0)

        # Build feature dictionary
        feat_dict = {
            "contact_count_6A": float(len(neighbors_6A)),
            "contact_count_8A": float(n_contacts_8A),
            "contact_count_10A": float(len(neighbors_10A)),
            "contact_count_local_seq_le4": float(len(local_seq_le4)),
            "contact_count_med_seq_5_10": float(len(med_seq_5_10)),
            "contact_count_long_seq_gt10": float(len(long_seq_gt10)),
            "contact_count_long_seq_gt20": float(len(long_seq_gt20)),
            "contact_ratio_long_to_total": float(ratio_long),
            "local_contact_density_8A": float(density_8A),
            "mean_contact_distance_8A": float(mean_dist_8A),
            "std_contact_distance_8A": float(std_dist_8A),
            "mean_seq_separation_8A": float(mean_seq_sep),
            "median_seq_separation_8A": float(median_seq_sep),
            "max_seq_separation_8A": float(max_seq_sep),
            "min_seq_separation_8A": float(min_seq_sep),
            "std_seq_separation_8A": float(std_seq_sep),
        }

        for aa in AA_LIST:
            feat_dict[f"contact_aa_count_{aa}"] = float(aa_counts[aa])
        for aa in AA_LIST:
            feat_dict[f"contact_aa_prop_{aa}"] = float(aa_props[aa])

        feat_dict["contact_mean_kyte_doolittle"] = float(mean_kd)
        feat_dict["contact_mean_vdw_volume"] = float(mean_vdw)
        feat_dict["contact_mean_formal_charge"] = float(mean_charge)
        feat_dict["contact_mean_polarity"] = float(mean_polar)
        feat_dict["contact_mean_mol_weight"] = float(mean_mw)
        feat_dict["contact_total_charge"] = float(total_charge)

        feat_dict.update(wt_onehot)
        feat_dict.update(mut_onehot)

        feat_dict["delta_kyte_doolittle"] = float(delta_kd)
        feat_dict["delta_vdw_volume"] = float(delta_vdw)
        feat_dict["delta_formal_charge"] = float(delta_charge)
        feat_dict["delta_polarity"] = float(delta_polar)
        feat_dict["delta_mol_weight"] = float(delta_mw)

        # Audit info for 5-sample detailed inspection
        neighbor_details = []
        for j in neighbors_8A:
            r_j = valid_residues[j]
            r_j_name = r_j.get_resname().strip()
            r_j_one = THREE_TO_ONE.get(r_j_name, '?')
            r_j_num = r_j.id[1]
            r_j_dist = float(target_distances[j])
            r_j_seq_sep = int(abs(target_idx - j))
            neighbor_details.append({
                "resnum": r_j_num,
                "aa": r_j_one,
                "distance_A": round(r_j_dist, 3),
                "seq_separation": r_j_seq_sep
            })

        # Sort neighbors by distance
        neighbor_details.sort(key=lambda x: x["distance_A"])

        audit_dict = {
            "experiment_id": str(row['experiment_id']),
            "uniprot_id": str(row['uniprot_id']),
            "pdb_id": pdb_id,
            "chain": chain_id,
            "fireprot_position": int(row['fireprot_position']),
            "pdb_residue_number": resnum,
            "wild_type": wt_aa,
            "mutation": mut_aa,
            "contact_count_8A": n_contacts_8A,
            "long_range_contact_count_gt10": len(long_seq_gt10),
            "contacting_neighbors": neighbor_details[:5]  # Top 5 nearest contacting residues
        }

        return feat_dict, audit_dict
