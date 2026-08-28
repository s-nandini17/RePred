import numpy as np
import pandas as pd
from Bio.Align import substitution_matrices

# Standard 20 Amino Acid Alphabet
AA_LIST = list("ACDEFGHIKLMNPQRSTVWY")
AA_TO_IDX = {aa: i for i, aa in enumerate(AA_LIST)}
N_AAS = len(AA_LIST)

# Load standard BLOSUM62 matrix
try:
    BLOSUM62 = substitution_matrices.load("BLOSUM62")
except Exception:
    BLOSUM62 = None

# Biological Reference Property Tables (Kyte-Doolittle, Volume, pI, Molecular Weight)
HYDROPHOBICITY = {
    'A': 1.8,  'R': -4.5, 'N': -3.5, 'D': -3.5, 'C': 2.5,
    'Q': -3.5, 'E': -3.5, 'G': -0.4, 'H': -3.2, 'I': 4.5,
    'L': 3.8,  'K': -3.9, 'M': 1.9,  'F': 2.8,  'P': -1.6,
    'S': -0.8, 'T': -0.7, 'W': -0.9, 'Y': -1.3, 'V': 4.2
}

VOLUME = {
    'A': 88.6,  'R': 173.4, 'N': 114.1, 'D': 111.1, 'C': 108.5,
    'Q': 143.8, 'E': 138.4, 'G': 60.1,  'H': 153.2, 'I': 166.7,
    'L': 166.7, 'K': 168.6, 'M': 162.9, 'F': 189.9, 'P': 112.7,
    'S': 89.0,  'T': 116.1, 'W': 227.8, 'Y': 193.6, 'V': 140.0
}

PI_CHARGE = {
    'A': 6.00,  'R': 10.76, 'N': 5.41, 'D': 2.77, 'C': 5.07,
    'Q': 5.65,  'E': 3.22,  'G': 5.97, 'H': 7.59, 'I': 6.02,
    'L': 5.98,  'K': 9.74,  'M': 5.74, 'F': 5.48, 'P': 6.30,
    'S': 5.68,  'T': 5.60,  'W': 5.89, 'Y': 5.66, 'V': 5.96
}

MW = {
    'A': 89.09,  'R': 174.20, 'N': 132.12, 'D': 133.10, 'C': 121.16,
    'Q': 146.15, 'E': 147.13, 'G': 75.07,  'H': 155.16, 'I': 131.17,
    'L': 131.17, 'K': 146.19, 'M': 149.21, 'F': 165.19, 'P': 115.13,
    'S': 105.09, 'T': 119.12, 'W': 204.23, 'Y': 181.19, 'V': 117.15
}

def one_hot_encode_aa(aa):
    """Encodes a single amino acid into a 20-dimensional one-hot vector."""
    vec = np.zeros(N_AAS, dtype=np.float32)
    if aa in AA_TO_IDX:
        vec[AA_TO_IDX[aa]] = 1.0
    return vec

def get_blosum62_score(wt, mut):
    """Retrieves BLOSUM62 substitution matrix score for wt -> mut."""
    if BLOSUM62 is not None:
        try:
            return float(BLOSUM62[wt, mut])
        except KeyError:
            return 0.0
    return 0.0

class SequenceRepresentationExtractor:
    """
    Extracts features for the Hand-Engineered Sequence/Mutation Representation for ddG prediction.
    Uses ONLY real sequence data and deterministic biological property tables.

    Terminology & Boundary Handling:
    - Default feature dimension: Exactly 252 dimensions when ablation_mode=None.
    - Out-of-range sequence context is represented by a zero vector to indicate unavailable context.
    - No artificial or invented amino acids are added.

    Ablation Modes Supported:
    - None: Full 252-dim representation (Default)
    - "no_abs_pos": Excludes absolute position (251 dims)
    - "no_position": Excludes positional features (249 dims)
    - "no_context": Excludes local sequence context (52 dims)
    - "mutation_only": Excludes position and context features (49 dims)
    """
    def __init__(self, context_k=5, ablation_mode=None):
        self.context_k = context_k
        self.ablation_mode = ablation_mode

    def extract_mutation_features(self, wild_type, mutation, position, sequence):
        """
        Extracts feature vector for a single mutation sample.
        """
        wt = str(wild_type).strip()
        mut = str(mutation).strip()
        pos = int(position)  # 1-based index
        seq = str(sequence).strip()
        seq_len = len(seq)

        # 1. One-hot wild-type & mutant encodings (20 + 20 = 40 dims)
        wt_onehot = one_hot_encode_aa(wt)
        mut_onehot = one_hot_encode_aa(mut)

        # 2. Mutation Delta & Physicochemical Properties (9 dims)
        blosum = get_blosum62_score(wt, mut)
        d_hydro = HYDROPHOBICITY.get(mut, 0.0) - HYDROPHOBICITY.get(wt, 0.0)
        d_vol = VOLUME.get(mut, 0.0) - VOLUME.get(wt, 0.0)
        d_pi = PI_CHARGE.get(mut, 0.0) - PI_CHARGE.get(wt, 0.0)
        d_mw = MW.get(mut, 0.0) - MW.get(wt, 0.0)

        wt_hydro = HYDROPHOBICITY.get(wt, 0.0)
        mut_hydro = HYDROPHOBICITY.get(mut, 0.0)
        wt_vol = VOLUME.get(wt, 0.0)
        mut_vol = VOLUME.get(mut, 0.0)

        prop_features = np.array([
            blosum, d_hydro, d_vol, d_pi, d_mw,
            wt_hydro, mut_hydro, wt_vol, mut_vol
        ], dtype=np.float32)

        # 3. Positional features (3 dims or ablated)
        rel_pos = float(pos) / float(seq_len) if seq_len > 0 else 0.0
        if self.ablation_mode == "no_abs_pos":
            pos_features = np.array([seq_len, rel_pos], dtype=np.float32)
        elif self.ablation_mode in ("no_position", "mutation_only"):
            pos_features = np.array([], dtype=np.float32)
        else:
            pos_features = np.array([pos, seq_len, rel_pos], dtype=np.float32)

        # 4. Local sequence context (200 dims or ablated)
        # Note: Out-of-range sequence context is represented by a zero vector to indicate unavailable context.
        if self.ablation_mode in ("no_context", "mutation_only"):
            context_vector = np.array([], dtype=np.float32)
        else:
            left_context = []
            for i in range(pos - 1 - self.context_k, pos - 1):
                if 0 <= i < seq_len:
                    left_context.append(one_hot_encode_aa(seq[i]))
                else:
                    left_context.append(np.zeros(N_AAS, dtype=np.float32))

            right_context = []
            for i in range(pos, pos + self.context_k):
                if 0 <= i < seq_len:
                    right_context.append(one_hot_encode_aa(seq[i]))
                else:
                    right_context.append(np.zeros(N_AAS, dtype=np.float32))

            context_vector = np.concatenate(left_context + right_context)

        # Combine all features into single 1D feature array
        full_feature_vector = np.concatenate([
            wt_onehot,
            mut_onehot,
            prop_features,
            pos_features,
            context_vector
        ])

        return full_feature_vector

    def transform_dataframe(self, df):
        """
        Transforms a DataFrame of mutations into a 2D numpy feature matrix X.
        """
        features_list = []
        for idx, row in df.iterrows():
            feat = self.extract_mutation_features(
                wild_type=row['wild_type'],
                mutation=row['mutation'],
                position=row['position'],
                sequence=row['sequence']
            )
            features_list.append(feat)

        X = np.vstack(features_list)
        return X

if __name__ == "__main__":
    extractor = SequenceRepresentationExtractor(context_k=5, ablation_mode=None)
    sample_feat = extractor.extract_mutation_features('A', 'V', 10, "MKTAYIAKQRQISFVKSHFSRQ")
    print(f"Default Extractor initialized! Dimension: {sample_feat.shape} (Expected: (252,))")
    assert sample_feat.shape[0] == 252, "Default dimension must be exactly 252!"
