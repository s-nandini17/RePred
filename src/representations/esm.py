import os
import torch
import esm
import numpy as np
import pandas as pd

LOCAL_ESM2_8M_PATH = "/Users/a2251/.cache/torch/hub/checkpoints/esm2_t6_8M_UR50D.pt"

class ESMRepresentationExtractor:
    """
    Frozen ESM-2 8M representation extractor for protein stability prediction (ddG).
    Uses locally cached weights esm2_t6_8M_UR50D.pt (zero network downloads).

    Feature Vector (1,280 Dims):
    - e_wt(p): WT positional embedding at position p (320 dims)
    - e_mut(p): Mutant positional embedding at position p (320 dims)
    - delta_e(p): e_mut(p) - e_wt(p) difference embedding (320 dims)
    - mean_e_wt: Mean-pooled WT sequence embedding (320 dims)
    Total = 1,280 dimensions.
    """
    def __init__(self, checkpoint_path=LOCAL_ESM2_8M_PATH, device="cpu"):
        self.checkpoint_path = checkpoint_path
        self.device = device
        self.model = None
        self.alphabet = None
        self.batch_converter = None
        self.repr_layer = 6
        self.hidden_dim = 320
        self.load_model()

    def load_model(self):
        if not os.path.exists(self.checkpoint_path):
            raise FileNotFoundError(f"ESM-2 8M checkpoint not found at {self.checkpoint_path}")
        
        # Load local checkpoint
        self.model, self.alphabet = esm.pretrained.load_model_and_alphabet_local(self.checkpoint_path)
        self.model.eval()
        for param in self.model.parameters():
            param.requires_grad = False
        self.model.to(self.device)
        self.batch_converter = self.alphabet.get_batch_converter()

    def extract_sequence_embedding(self, sequence):
        """
        Extracts per-token representation tensor (L+2, 320) and mean-pooled representation (320,).
        Note: Token index 0 is <cls>, index L+1 is <eos>. Token index p (1 <= p <= L) corresponds to residue p.
        """
        sequence = str(sequence).strip()
        data = [("protein", sequence)]
        batch_labels, batch_strs, batch_tokens = self.batch_converter(data)
        batch_tokens = batch_tokens.to(self.device)

        with torch.no_grad():
            results = self.model(batch_tokens, repr_layers=[self.repr_layer], return_contacts=False)
        
        token_representations = results["representations"][self.repr_layer][0] # (L+2, 320)
        
        # Mean-pooled representation excluding <cls> (idx 0) and <eos> (idx -1)
        seq_len = len(sequence)
        residue_tokens = token_representations[1 : seq_len + 1] # (L, 320)
        mean_embedding = residue_tokens.mean(dim=0) # (320,)

        return token_representations.cpu().numpy(), mean_embedding.cpu().numpy()

    def build_mutation_feature_vector(self, wt_token_rep, mut_token_rep, wt_mean_emb, position):
        """
        Constructs 1,280-dim mutation vector given token representations and 1-based position p.
        """
        pos = int(position)
        # Token index p corresponds to 1-based residue position p
        e_wt_p = wt_token_rep[pos]          # (320,)
        e_mut_p = mut_token_rep[pos]        # (320,)
        delta_e_p = e_mut_p - e_wt_p        # (320,)
        mean_e_wt = wt_mean_emb             # (320,)

        feature_vector = np.concatenate([e_wt_p, e_mut_p, delta_e_p, mean_e_wt])
        return feature_vector

if __name__ == "__main__":
    extractor = ESMRepresentationExtractor()
    wt_seq = "MKTAYIAKQRQISFVKSHFSRQ"
    mut_seq = "MKTAYIAKVRQISFVKSHFSRQ"
    wt_rep, wt_mean = extractor.extract_sequence_embedding(wt_seq)
    mut_rep, mut_mean = extractor.extract_sequence_embedding(mut_seq)
    feat = extractor.build_mutation_feature_vector(wt_rep, mut_rep, wt_mean, 8)
    print(f"ESM Extractor verified! Output feature vector shape: {feat.shape} (Expected: (1280,))")
    assert feat.shape[0] == 1280, f"Expected 1280 dims, got {feat.shape[0]}"
