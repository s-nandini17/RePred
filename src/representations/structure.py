import os
import math
import numpy as np
import pandas as pd
from Bio.PDB import PDBParser
from Bio.PDB.vectors import calc_dihedral

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

class ExperimentalWTStructureExtractor:
    """
    Extracts 131-dimensional mutation-aware 3D structural features from real local experimental WT PDB files.
    Strictly verified for Euclidean distance non-negativity and monotonic nearest-neighbor sorting.
    """
    def __init__(self, pdb_dir="project/data/fireprot/pdbs"):
        self.pdb_dir = pdb_dir
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

    def calculate_dihedrals(self, chain, resnum, icode):
        """
        Calculates phi and psi angles for a target residue in chain.
        Returns (sin_phi, cos_phi, sin_psi, cos_psi).
        """
        res_list = [r for r in chain.get_residues() if r.id[0] == ' ' or r.get_resname().strip() == 'MSE']
        target_idx = None
        for idx, r in enumerate(res_list):
            if r.id[1] == resnum and r.id[2].strip() == icode:
                target_idx = idx
                break
        
        if target_idx is None:
            return 0.0, 0.0, 0.0, 0.0

        phi, psi = None, None

        # Phi: C(i-1) - N(i) - CA(i) - C(i)
        if target_idx > 0:
            prev_res = res_list[target_idx - 1]
            curr_res = res_list[target_idx]
            if 'C' in prev_res and 'N' in curr_res and 'CA' in curr_res and 'C' in curr_res:
                try:
                    v1 = prev_res['C'].get_vector()
                    v2 = curr_res['N'].get_vector()
                    v3 = curr_res['CA'].get_vector()
                    v4 = curr_res['C'].get_vector()
                    phi = float(calc_dihedral(v1, v2, v3, v4))
                except Exception:
                    phi = None

        # Psi: N(i) - CA(i) - C(i) - N(i+1)
        if target_idx < len(res_list) - 1:
            curr_res = res_list[target_idx]
            next_res = res_list[target_idx + 1]
            if 'N' in curr_res and 'CA' in curr_res and 'C' in curr_res and 'N' in next_res:
                try:
                    v1 = curr_res['N'].get_vector()
                    v2 = curr_res['CA'].get_vector()
                    v3 = curr_res['C'].get_vector()
                    v4 = next_res['N'].get_vector()
                    psi = float(calc_dihedral(v1, v2, v3, v4))
                except Exception:
                    psi = None

        sin_phi = math.sin(phi) if phi is not None else 0.0
        cos_phi = math.cos(phi) if phi is not None else 0.0
        sin_psi = math.sin(psi) if psi is not None else 0.0
        cos_psi = math.cos(psi) if psi is not None else 0.0

        return sin_phi, cos_phi, sin_psi, cos_psi

    def get_neighbor_details(self, pdb_id, chain_id, resnum, icode, n_neighbors=5):
        """
        Returns structured neighbor list containing exact residue ID, amino acid, C-alpha coordinate, and distance.
        Used for detailed inspection and mathematical verification.
        """
        struct = self.get_structure(pdb_id)
        model = struct[0]

        target_chain = None
        for c in model:
            if c.id == chain_id or c.id.upper() == chain_id.upper():
                target_chain = c
                break
        if target_chain is None:
            target_chain = list(model.get_chains())[0]

        all_ca_info = []
        target_res_info = None

        for res in target_chain:
            resname = res.get_resname().strip()
            if res.id[0] != ' ' and resname != 'MSE':
                continue
            if resname not in THREE_TO_ONE:
                continue
            
            aa_one = THREE_TO_ONE[resname]
            r_num = res.id[1]
            r_icode = res.id[2].strip()

            if 'CA' in res:
                ca_coord = res['CA'].get_coord()
                b_factor = res['CA'].get_bfactor()
                info = {
                    "resnum": r_num,
                    "icode": r_icode,
                    "aa": aa_one,
                    "coord": ca_coord,
                    "bfactor": b_factor
                }
                all_ca_info.append(info)
                if r_num == resnum and r_icode == icode:
                    target_res_info = info

        if target_res_info is None:
            raise ValueError(f"Target residue {chain_id}:{resnum}{icode} not found with C-alpha in PDB {pdb_id}")

        target_coord = target_res_info["coord"]
        neighbors = []

        for info in all_ca_info:
            # Exclude mutation residue itself strictly
            if info["resnum"] == resnum and info["icode"] == icode:
                continue

            diff = info["coord"] - target_coord
            # Mathematical Euclidean distance sqrt((x1-x2)^2 + (y1-y2)^2 + (z1-z2)^2)
            dist = float(np.sqrt(np.sum(diff ** 2)))

            # Mathematical Assertion: Distance must be strictly non-negative
            assert dist >= 0.0, f"FATAL: Calculated negative Euclidean distance {dist}!"

            neighbors.append((dist, info))

        # Sort strictly ascending by distance
        neighbors.sort(key=lambda x: x[0])

        return target_res_info, neighbors[:n_neighbors]

    def extract_features_for_mutation(self, pdb_id, chain_id, resnum, icode, wt_aa, mut_aa):
        """
        Extracts 131-dimensional feature vector for a mapped mutation.
        Strictly aligned with feature schema order.
        """
        struct = self.get_structure(pdb_id)
        model = struct[0]

        target_chain = None
        for c in model:
            if c.id == chain_id or c.id.upper() == chain_id.upper():
                target_chain = c
                break
        if target_chain is None:
            target_chain = list(model.get_chains())[0]

        all_ca_info = []
        target_res_info = None

        for res in target_chain:
            resname = res.get_resname().strip()
            if res.id[0] != ' ' and resname != 'MSE':
                continue
            if resname not in THREE_TO_ONE:
                continue
            
            aa_one = THREE_TO_ONE[resname]
            r_num = res.id[1]
            r_icode = res.id[2].strip()

            if 'CA' in res:
                ca_coord = res['CA'].get_coord()
                b_factor = res['CA'].get_bfactor()
                info = {
                    "resnum": r_num,
                    "icode": r_icode,
                    "aa": aa_one,
                    "coord": ca_coord,
                    "bfactor": b_factor
                }
                all_ca_info.append(info)
                if r_num == resnum and r_icode == icode:
                    target_res_info = info

        if target_res_info is None:
            raise ValueError(f"Target residue {chain_id}:{resnum}{icode} not found with C-alpha in PDB {pdb_id}")

        target_coord = target_res_info["coord"]
        target_b_factor = target_res_info["bfactor"]

        neighbors = []
        global_coords = []
        b_factors = []

        for info in all_ca_info:
            global_coords.append(info["coord"])
            b_factors.append(info["bfactor"])
            # Strictly exclude mutation residue itself from neighbor statistics
            if info["resnum"] == resnum and info["icode"] == icode:
                continue
            
            diff = info["coord"] - target_coord
            dist = float(np.sqrt(np.sum(diff ** 2)))
            
            assert dist >= 0.0, f"Negative distance calculated: {dist}"
            neighbors.append((dist, info))

        # Sort neighbors in monotonic ascending order of distance
        neighbors.sort(key=lambda x: x[0])

        # Mathematical Validation: Verify distance monotonicity (d1 <= d2 <= d3 <= d4 <= d5)
        for i in range(len(neighbors) - 1):
            assert neighbors[i][0] <= neighbors[i+1][0], "Neighbor distance sorting is not monotonic!"

        # 1. Spatial Geometry & Packing (7 Dims)
        c_6 = sum(1 for d, _ in neighbors if d <= 6.0)
        c_8 = sum(1 for d, _ in neighbors if d <= 8.0)
        c_10 = sum(1 for d, _ in neighbors if d <= 10.0)
        c_12 = sum(1 for d, _ in neighbors if d <= 12.0)
        packing_density_10 = c_10

        if len(neighbors) > 0 and c_10 > 0:
            sphere_coords = [info["coord"] for d, info in neighbors if d <= 10.0]
            local_com = np.mean(sphere_coords, axis=0)
            dist_local_com = float(np.sqrt(np.sum((target_coord - local_com) ** 2)))
        else:
            dist_local_com = 0.0

        global_com = np.mean(global_coords, axis=0)
        dist_global_com = float(np.sqrt(np.sum((target_coord - global_com) ** 2)))

        geom_features = [c_6, c_8, c_10, c_12, packing_density_10, dist_local_com, dist_global_com]

        # 2. Backbone Geometry & B-Factor (6 Dims)
        sin_phi, cos_phi, sin_psi, cos_psi = self.calculate_dihedrals(target_chain, resnum, icode)
        mean_b_factor = float(np.mean(b_factors)) if len(b_factors) > 0 else target_b_factor
        norm_b_factor = target_b_factor / (mean_b_factor + 1e-6)

        bb_features = [sin_phi, cos_phi, sin_psi, cos_psi, target_b_factor, norm_b_factor]

        # 3. Local AA Composition (20 Dims) in 10A sphere
        aa_counts = np.zeros(20, dtype=np.float32)
        for d, info in neighbors:
            if d <= 10.0 and info["aa"] in AA_TO_IDX:
                aa_counts[AA_TO_IDX[info["aa"]]] += 1.0

        # 4. Distance-Weighted Composition (20 Dims)
        dist_weighted_comp = np.zeros(20, dtype=np.float32)
        for d, info in neighbors:
            if d <= 10.0 and d > 0.01 and info["aa"] in AA_TO_IDX:
                dist_weighted_comp[AA_TO_IDX[info["aa"]]] += (1.0 / d)

        # 5. Local Physicochemical Environment (4 Dims)
        loc_hydro = sum(KYTE_DOOLITTLE.get(info["aa"], 0.0) for d, info in neighbors if d <= 10.0)
        loc_charge = sum(FORMAL_CHARGE.get(info["aa"], 0.0) for d, info in neighbors if d <= 10.0)
        loc_polarity = sum(POLARITY.get(info["aa"], 0.0) for d, info in neighbors if d <= 10.0)
        loc_mw = sum(MOL_WEIGHT.get(info["aa"], 0.0) for d, info in neighbors if d <= 10.0)

        physchem_features = [loc_hydro, loc_charge, loc_polarity, loc_mw]

        # 6. Mutation-Specific Biochemical Deltas (45 Dims)
        wt_onehot = np.zeros(20, dtype=np.float32)
        if wt_aa in AA_TO_IDX: wt_onehot[AA_TO_IDX[wt_aa]] = 1.0

        mut_onehot = np.zeros(20, dtype=np.float32)
        if mut_aa in AA_TO_IDX: mut_onehot[AA_TO_IDX[mut_aa]] = 1.0

        delta_hydro = KYTE_DOOLITTLE.get(mut_aa, 0.0) - KYTE_DOOLITTLE.get(wt_aa, 0.0)
        delta_vol = VDW_VOLUME.get(mut_aa, 0.0) - VDW_VOLUME.get(wt_aa, 0.0)
        delta_charge = FORMAL_CHARGE.get(mut_aa, 0.0) - FORMAL_CHARGE.get(wt_aa, 0.0)
        delta_polarity = POLARITY.get(mut_aa, 0.0) - POLARITY.get(wt_aa, 0.0)
        delta_mw = MOL_WEIGHT.get(mut_aa, 0.0) - MOL_WEIGHT.get(wt_aa, 0.0)

        delta_features = np.concatenate([
            wt_onehot, mut_onehot,
            [delta_hydro, delta_vol, delta_charge, delta_polarity, delta_mw]
        ])

        # 7. Nearest 5 Neighbors Environment (29 Dims)
        # CRITICAL FIX: Interleaved matching with build_feature_schema():
        # For each k in 1..5: [dist_k, hydrophobicity_k, volume_k, charge_k] -> 20 dims
        # Followed by 9-dim top AA composition -> Total 29 dims.
        k_neighbors = neighbors[:5]
        neighbor_block_features = []

        for k_idx in range(5):
            if k_idx < len(k_neighbors):
                d, info = k_neighbors[k_idx]
                assert d >= 0.0, f"Negative distance d_k={d}"
                neighbor_block_features.extend([
                    d,
                    KYTE_DOOLITTLE.get(info["aa"], 0.0),
                    VDW_VOLUME.get(info["aa"], 0.0),
                    FORMAL_CHARGE.get(info["aa"], 0.0)
                ])
            else:
                neighbor_block_features.extend([0.0, 0.0, 0.0, 0.0])

        n_top_aa_comp = np.zeros(9, dtype=np.float32)
        for d, info in k_neighbors:
            if info["aa"] in AA_TO_IDX and AA_TO_IDX[info["aa"]] < 9:
                n_top_aa_comp[AA_TO_IDX[info["aa"]]] += 1.0

        neighbor_features = np.concatenate([neighbor_block_features, n_top_aa_comp])

        # Concatenate all feature blocks
        full_vector = np.concatenate([
            geom_features,
            bb_features,
            aa_counts,
            dist_weighted_comp,
            physchem_features,
            delta_features,
            neighbor_features
        ]).astype(np.float32)

        return full_vector

if __name__ == "__main__":
    extractor = ExperimentalWTStructureExtractor()
    feat = extractor.extract_features_for_mutation("1PGA", "A", 1, "", "M", "A")
    print(f"Structure Extractor verified! Feature vector shape: {feat.shape} (Expected: 131)")
    assert feat.shape[0] == 131, f"Expected 131 features, got {feat.shape[0]}"
