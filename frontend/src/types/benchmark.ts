export interface MutationItem {
  experiment_id: string;
  uniprot_id: string;
  pdb_id: string;
  chain: string;
  position: number;
  pdb_position: number;
  wt_aa: string;
  mut_aa: string;
  mutation: string;
  pdb_mutation: string;
  ddG: number;
  split: string;
  sequence?: string;
}

export interface BenchmarkComparisonItem {
  representation: string;
  feature_or_architecture: string;
  test_mae: number;
  test_rmse: number;
  test_r2: number;
  test_pearson: number;
  test_spearman: number;
  grouped_cv_mae_mean: number;
  grouped_cv_mae_std: number;
  grouped_cv_rmse_mean: number;
  grouped_cv_rmse_std: number;
  grouped_cv_r2_mean: number;
  grouped_cv_r2_std: number;
  grouped_cv_pearson_mean: number;
  grouped_cv_pearson_std: number;
  grouped_cv_spearman_mean: number;
  grouped_cv_spearman_std: number;
}

export interface FeatureImportanceItem {
  feature_name: string;
  importance: number;
  rank: number;
  feature_group: string;
  representation?: string;
  interpretation?: string;
}

export interface PredictionMap {
  [experiment_id: string]: {
    gnn?: number;
    '3d'?: number;
    contact_map?: number;
    sequence?: number;
  };
}

export interface FeatureMap {
  [experiment_id: string]: {
    [feature_name: string]: number | string;
  };
}
