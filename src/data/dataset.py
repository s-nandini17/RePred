import os
import pandas as pd
import numpy as np

class FireProtDataset:
    """
    Dataset loader for FireProt protein stability benchmark.
    Preserves official splits (train, val, test) and validates real biological data.
    """
    def __init__(self, data_dir="project/data/fireprot/original_copies"):
        self.data_dir = data_dir
        self.combined_path = os.path.join(data_dir, "combined_fireprot.csv")
        self.train_path = os.path.join(data_dir, "fireprot_train.csv")
        self.val_path = os.path.join(data_dir, "fireprot_val.csv")
        self.test_path = os.path.join(data_dir, "fireprot_test.csv")
        
        self.df_combined = None
        self.df_train = None
        self.df_val = None
        self.df_test = None
        
        self.load_data()

    def load_data(self):
        if not os.path.exists(self.combined_path):
            raise FileNotFoundError(f"Combined data file not found at {self.combined_path}")
            
        self.df_combined = pd.read_csv(self.combined_path)
        self.df_train = pd.read_csv(self.train_path)
        self.df_val = pd.read_csv(self.val_path)
        self.df_test = pd.read_csv(self.test_path)
        
        self.validate_dataset(self.df_combined, "Combined")
        self.validate_dataset(self.df_train, "Train")
        self.validate_dataset(self.df_val, "Val")
        self.validate_dataset(self.df_test, "Test")

    def validate_dataset(self, df, name):
        required_cols = ['experiment_id', 'wild_type', 'mutation', 'position', 'sequence', 'ddG', 'uniprot_id', 'pdb_id_corrected']
        for col in required_cols:
            if col not in df.columns:
                raise ValueError(f"Missing required column '{col}' in {name} dataset.")
            null_cnt = df[col].isnull().sum()
            if null_cnt > 0:
                print(f"WARNING: {name} dataset has {null_cnt} missing values in column '{col}'")
                
        # Validate target ddG is numeric
        if not np.issubdtype(df['ddG'].dtype, np.number):
            raise TypeError(f"Target 'ddG' in {name} dataset is not numeric!")

    def get_split(self, split="train"):
        if split == "train":
            return self.df_train.copy()
        elif split == "val" or split == "validation":
            return self.df_val.copy()
        elif split == "test":
            return self.df_test.copy()
        elif split == "combined":
            return self.df_combined.copy()
        else:
            raise ValueError(f"Unknown split: {split}. Choose from ['train', 'val', 'test', 'combined']")

if __name__ == "__main__":
    ds = FireProtDataset()
    print(f"Dataset successfully loaded! Train: {len(ds.df_train)}, Val: {len(ds.df_val)}, Test: {len(ds.df_test)}")
