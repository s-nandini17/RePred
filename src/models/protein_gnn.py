import os
import math
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
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

class PDBGraphBuilder:
    """
    Parses PDB files into real WT protein graphs and dynamic 58D node feature matrices.
    Graphs are cached in memory per unique PDB structure (100 PDBs).
    Primary contact threshold: 8.0 Å Cα-Cα.
    """
    def __init__(self, pdb_dir="project/data/fireprot/pdbs", contact_threshold=8.0):
        self.pdb_dir = pdb_dir
        self.contact_threshold = contact_threshold
        self.parser = PDBParser(QUIET=True)
        self.base_graph_cache = {}

    def get_base_graph(self, pdb_id, chain_id):
        pdb_id_upper = pdb_id.upper()
        cache_key = (pdb_id_upper, chain_id)
        if cache_key in self.base_graph_cache:
            return self.base_graph_cache[cache_key]

        pdb_path = os.path.join(self.pdb_dir, f"{pdb_id_upper}.pdb")
        if not os.path.exists(pdb_path):
            raise FileNotFoundError(f"PDB file missing: {pdb_path}")

        struct = self.parser.get_structure(pdb_id_upper, pdb_path)
        model = struct[0]

        target_chain = None
        for c in model:
            if c.id == chain_id or c.id.upper() == chain_id.upper():
                target_chain = c
                break
        if target_chain is None:
            target_chain = list(model.get_chains())[0]

        chain = target_chain

        valid_residues = []
        for r in chain.get_residues():
            if (r.id[0] == ' ' or r.get_resname().strip() == 'MSE') and 'CA' in r:
                valid_residues.append(r)

        N = len(valid_residues)
        if N == 0:
            raise ValueError(f"No Cα atoms found in chain {chain_id} of PDB {pdb_id}")

        ca_coords = np.array([r['CA'].get_coord() for r in valid_residues], dtype=np.float64)
        b_factors = np.array([r['CA'].get_bfactor() for r in valid_residues], dtype=np.float64)

        b_mean = np.mean(b_factors)
        b_std = np.std(b_factors)
        b_norm = (b_factors - b_mean) / (b_std + 1e-5)

        # Build 32D Base Node Features
        base_node_features = []
        for idx, r in enumerate(valid_residues):
            r_name = r.get_resname().strip()
            aa1 = THREE_TO_ONE.get(r_name, 'A')

            # 1. 20D WT One-Hot
            wt_onehot = [1.0 if aa1 == aa else 0.0 for aa in AA_LIST]

            # 2. 1D Normalized sequence position
            pos_norm = float(idx) / float(N)

            # 3. 1D Normalized B-factor
            bf = float(b_norm[idx])

            # 4. 5D Physicochemical properties
            kd = KYTE_DOOLITTLE.get(aa1, 0.0)
            vdw = VDW_VOLUME.get(aa1, 100.0)
            charge = FORMAL_CHARGE.get(aa1, 0.0)
            polar = POLARITY.get(aa1, 0.0)
            mw = MOL_WEIGHT.get(aa1, 100.0)

            # 5. 5D Dihedral features (sin_phi, cos_phi, sin_psi, cos_psi, has_dihedrals)
            phi, psi = None, None
            if idx > 0:
                prev_res = valid_residues[idx - 1]
                if 'C' in prev_res and 'N' in r and 'CA' in r and 'C' in r:
                    try:
                        v1 = prev_res['C'].get_vector()
                        v2 = r['N'].get_vector()
                        v3 = r['CA'].get_vector()
                        v4 = r['C'].get_vector()
                        phi = float(calc_dihedral(v1, v2, v3, v4))
                    except Exception:
                        phi = None

            if idx < N - 1:
                next_res = valid_residues[idx + 1]
                if 'N' in r and 'CA' in r and 'C' in r and 'N' in next_res:
                    try:
                        v1 = r['N'].get_vector()
                        v2 = r['CA'].get_vector()
                        v3 = r['C'].get_vector()
                        v4 = next_res['N'].get_vector()
                        psi = float(calc_dihedral(v1, v2, v3, v4))
                    except Exception:
                        psi = None

            sin_phi = math.sin(phi) if phi is not None else 0.0
            cos_phi = math.cos(phi) if phi is not None else 0.0
            sin_psi = math.sin(psi) if psi is not None else 0.0
            cos_psi = math.cos(psi) if psi is not None else 0.0
            has_dih = 1.0 if (phi is not None and psi is not None) else 0.0

            row_feat = wt_onehot + [pos_norm, bf, kd, vdw, charge, polar, mw, sin_phi, cos_phi, sin_psi, cos_psi, has_dih]
            base_node_features.append(row_feat)

        H_base = np.array(base_node_features, dtype=np.float32)  # Shape (N, 32)

        # Build Edges (8.0 Å threshold, symmetric, i != j)
        diffs = ca_coords[:, np.newaxis, :] - ca_coords[np.newaxis, :, :]
        dist_matrix = np.sqrt(np.sum(diffs ** 2, axis=-1))

        edge_src = []
        edge_dst = []
        edge_attr_list = []

        for i in range(N):
            for j in range(N):
                if i != j and dist_matrix[i, j] <= self.contact_threshold:
                    edge_src.append(i)
                    edge_dst.append(j)
                    d_ij = float(dist_matrix[i, j])
                    seq_sep = float(abs(i - j))
                    seq_sep_norm = seq_sep / float(N)
                    edge_attr_list.append([d_ij, seq_sep, seq_sep_norm])

        edge_index = np.array([edge_src, edge_dst], dtype=np.int64)  # Shape (2, E)
        edge_attr = np.array(edge_attr_list, dtype=np.float32)       # Shape (E, 3)

        base_data = {
            "H_base": H_base,
            "edge_index": edge_index,
            "edge_attr": edge_attr,
            "valid_residues": valid_residues,
            "N": N
        }
        self.base_graph_cache[cache_key] = base_data
        return base_data

    def build_mutation_graph(self, row):
        """
        Builds full 58D node feature graph for a single mutation row.
        Returns dictionary containing torch Tensors.
        """
        pdb_id = str(row['pdb_id']).strip().upper()
        chain_id = str(row['chain']).strip()
        resnum = int(row['pdb_residue_number'])
        icode = str(row['pdb_insertion_code']).strip() if pd.notna(row['pdb_insertion_code']) else ''
        wt_aa = str(row['wild_type']).strip().upper()
        mut_aa = str(row['mutation']).strip().upper()

        base_data = self.get_base_graph(pdb_id, chain_id)
        H_base = base_data["H_base"]
        edge_index = base_data["edge_index"]
        edge_attr = base_data["edge_attr"]
        valid_residues = base_data["valid_residues"]
        N = base_data["N"]

        # Locate mutation site index k
        target_idx = None
        for idx, r in enumerate(valid_residues):
            if r.id[1] == resnum and r.id[2].strip() == icode:
                target_idx = idx
                break

        if target_idx is None:
            raise KeyError(f"Residue {resnum}{icode} not found in PDB {pdb_id}")

        # Construct 26D Mutation Mask
        # 1D mutation indicator (1.0 at k, 0.0 elsewhere)
        mut_indicator = np.zeros((N, 1), dtype=np.float32)
        mut_indicator[target_idx, 0] = 1.0

        # 20D MUT one-hot (one-hot on node k, 0.0 elsewhere)
        mut_onehot_matrix = np.zeros((N, 20), dtype=np.float32)
        for aa_i, aa in enumerate(AA_LIST):
            if mut_aa == aa:
                mut_onehot_matrix[target_idx, aa_i] = 1.0

        # 5D Property Deltas (deltas on node k, 0.0 elsewhere)
        delta_kd = KYTE_DOOLITTLE.get(mut_aa, 0.0) - KYTE_DOOLITTLE.get(wt_aa, 0.0)
        delta_vdw = VDW_VOLUME.get(mut_aa, 0.0) - VDW_VOLUME.get(wt_aa, 0.0)
        delta_charge = FORMAL_CHARGE.get(mut_aa, 0.0) - FORMAL_CHARGE.get(wt_aa, 0.0)
        delta_polar = POLARITY.get(mut_aa, 0.0) - POLARITY.get(wt_aa, 0.0)
        delta_mw = MOL_WEIGHT.get(mut_aa, 0.0) - MOL_WEIGHT.get(wt_aa, 0.0)

        delta_vector_5d = np.array([delta_kd, delta_vdw, delta_charge, delta_polar, delta_mw], dtype=np.float32)
        delta_matrix = np.zeros((N, 5), dtype=np.float32)
        delta_matrix[target_idx] = delta_vector_5d

        # Concatenate 32D base + 26D mutation = 58D Total Node Features
        X_nodes = np.hstack([H_base, mut_indicator, mut_onehot_matrix, delta_matrix])
        assert X_nodes.shape[1] == 58, f"Expected 58 node features, got {X_nodes.shape[1]}"

        return {
            "x": torch.tensor(X_nodes, dtype=torch.float32),
            "edge_index": torch.tensor(edge_index, dtype=torch.long),
            "edge_attr": torch.tensor(edge_attr, dtype=torch.float32),
            "mutation_idx": torch.tensor(target_idx, dtype=torch.long),
            "mutation_deltas": torch.tensor(delta_vector_5d, dtype=torch.float32)
        }

def collate_graph_samples(batch_list):
    """
    Collate function to combine multiple disjoint protein graphs into a single batched graph.
    Offsets edge indices and mutation indices by cumulative node counts.
    """
    x_list = []
    edge_index_list = []
    edge_attr_list = []
    mut_idx_list = []
    deltas_list = []
    ddg_list = []

    node_offset = 0
    for sample in batch_list:
        n_nodes = sample["x"].size(0)

        x_list.append(sample["x"])
        edge_index_list.append(sample["edge_index"] + node_offset)
        edge_attr_list.append(sample["edge_attr"])

        mut_idx_list.append(sample["mutation_idx"] + node_offset)
        deltas_list.append(sample["mutation_deltas"])
        
        if "ddG" in sample:
            ddg_list.append(sample["ddG"])

        node_offset += n_nodes

    batched_x = torch.cat(x_list, dim=0)
    batched_edge_index = torch.cat(edge_index_list, dim=1)
    batched_edge_attr = torch.cat(edge_attr_list, dim=0)
    batched_mut_idx = torch.stack(mut_idx_list, dim=0)
    batched_deltas = torch.stack(deltas_list, dim=0)

    res = {
        "x": batched_x,
        "edge_index": batched_edge_index,
        "edge_attr": batched_edge_attr,
        "mutation_idx": batched_mut_idx,
        "mutation_deltas": batched_deltas
    }
    if len(ddg_list) > 0:
        res["ddG"] = torch.stack(ddg_list, dim=0)

    return res

class EdgeConvLayer(nn.Module):
    """
    Message Passing Layer that computes messages using node features and edge attributes:
    m_uv = MLP([h_v || e_uv])
    Aggregates messages by mean pooling over neighbors.
    """
    def __init__(self, in_dim, out_dim, edge_dim=3, dropout=0.1):
        super(EdgeConvLayer, self).__init__()
        self.msg_mlp = nn.Sequential(
            nn.Linear(in_dim + edge_dim, out_dim),
            nn.ReLU(),
            nn.Dropout(dropout)
        )
        self.node_linear = nn.Linear(in_dim, out_dim)
        self.norm = nn.LayerNorm(out_dim)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x, edge_index, edge_attr):
        N = x.size(0)
        src, dst = edge_index[0], edge_index[1]

        x_src = x[src]
        msg_input = torch.cat([x_src, edge_attr], dim=-1)
        messages = self.msg_mlp(msg_input)

        aggr = torch.zeros(N, messages.size(1), device=x.device)
        ones = torch.ones(src.size(0), 1, device=x.device)
        deg = torch.zeros(N, 1, device=x.device)

        aggr.index_add_(0, dst, messages)
        deg.index_add_(0, dst, ones)
        deg = torch.clamp(deg, min=1.0)
        aggr = aggr / deg

        h_self = self.node_linear(x)
        out = F.relu(self.norm(h_self + aggr))
        return self.dropout(out)

class ProteinGNN(nn.Module):
    """
    PyTorch Graph Neural Network for protein stability prediction.
    3 Message-Passing layers (58D node input -> 64D hidden).
    Mutation-centered readout extracts h_mut (64D) + mutation deltas (5D) -> MLP (69 -> 32 -> 1).
    Supports batched disjoint graph operations.
    """
    def __init__(self, in_node_dim=58, hidden_dim=64, edge_dim=3, layers=3, dropout=0.1):
        super(ProteinGNN, self).__init__()
        self.layers = nn.ModuleList()
        self.layers.append(EdgeConvLayer(in_node_dim, hidden_dim, edge_dim, dropout))
        for _ in range(layers - 1):
            self.layers.append(EdgeConvLayer(hidden_dim, hidden_dim, edge_dim, dropout))

        # Mutation-centered readout MLP: 64D node embedding + 5D deltas = 69D
        self.mlp = nn.Sequential(
            nn.Linear(hidden_dim + 5, 32),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(32, 1)
        )

    def forward(self, graph_data):
        x = graph_data["x"]
        edge_index = graph_data["edge_index"]
        edge_attr = graph_data["edge_attr"]
        mut_idx = graph_data["mutation_idx"]
        deltas = graph_data["mutation_deltas"]

        h = x
        for conv in self.layers:
            h = conv(h, edge_index, edge_attr)

        # Extract mutation node embeddings for batch: shape (B, 64)
        h_mut = h[mut_idx]

        # Concatenate 5D mutation deltas -> Shape (B, 69)
        concat_feat = torch.cat([h_mut, deltas], dim=-1)

        # MLP regression output scalar ddG -> Shape (B,)
        out = self.mlp(concat_feat)
        return out.squeeze(-1)
