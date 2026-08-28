/**
 * Type definitions for the Protein Representation Benchmark Dashboard.
 */

export interface ProteinSummary {
  id: string;
  name: string;
  organism: string;
  uniprot_id: string;
  ec_number?: string | null;
  function: string;
  length: number;
  pdb_id: string;
  pdb_chain: string;
  pdb_title: string;
  structure_type: string;
  resolution: string;
  datasets: string[];
  tasks: string[];
}

export interface ProteinDetails {
  metadata: ProteinSummary;
  sequence: string;
  sequence_length: number;
  structure: {
    pdb_id: string;
    chain: string;
    structure_type: string;
    resolution: string;
    mean_b_factor: number;
    residue_count: number;
  };
  datasets: DatasetSummary[];
}

export interface DatasetSummary {
  dataset_name: string;
  source: string;
  assay_type: string;
  measurement_type: string;
  units: string;
  directionality: string;
  num_mutations: number;
  pubmed_id: string;
  doi: string;
}

export interface ResidueInfo {
  chain: string;
  res_num: number;
  res_name: string;
  aa: string;
  ca_coord: [number, number, number];
  b_factor: number;
  sasa: number;
  rsa: number;
  secondary_structure: string;
}

export interface StructureData {
  protein_id: string;
  pdb_id: string;
  chain: string;
  structure_type: string;
  resolution: string;
  sequence: string;
  length: number;
  residues: ResidueInfo[];
  coordinates: [number, number, number][];
  distance_matrix: number[][];
  sasa: number[];
  rsa: number[];
  secondary_structure: string[];
  mean_b_factor: number;
}

export interface MutationRecord {
  mutation: string;
  wt_residue: string;
  mutant_residue: string;
  position: number;
  measurement: number;
  measurement_type: string;
  units: string;
  directionality: string;
  binary_label?: number;
  dataset_name?: string;
  assay_type?: string;
}

export interface RepresentationInfo {
  id: string;
  name: string;
  type: string;
  description: string;
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  std_err?: number;
}

export interface ScoreCard {
  representation_id: string;
  representation_name: string;
  task_id: string;
  primary_metric: string;
  raw_value: number;
  ideal_benchmark: number;
  normalization_method: string;
  normalized_value: number;
  final_score: number;
  confidence_interval_95: ConfidenceInterval;
  all_metrics: {
    spearman_rho?: number;
    pearson_r?: number;
    rmse?: number;
    mae?: number;
    r2?: number;
    auroc?: number;
    auprc?: number;
    accuracy?: number;
    f1?: number;
  };
  sample_count: number;
  warnings: string[];
  explanation: string;
  model_used?: string;
  feature_dim?: number;
}

export interface BenchmarkResponse {
  protein_id: string;
  protein_name: string;
  task_id: string;
  dataset_id: string;
  assay_source: string;
  measurement_type: string;
  units: string;
  directionality: string;
  model_evaluated: string;
  sample_count: number;
  leaderboard: ScoreCard[];
  all_results: ScoreCard[];
  secondary_relative_preferences_percent: Record<string, number>;
  experimental_ground_truth: number[];
  mutation_identifiers: string[];
  predictions_by_representation: Record<string, number[]>;
}

export interface FeatureContribution {
  feature_name: string;
  feature_value: number;
  importance_weight: number;
  category: string;
  contribution_direction: string;
}

export interface PredictionResponse {
  protein_id: string;
  task_id: string;
  mutation: string;
  wt_residue: string;
  mutant_residue: string;
  position: number;
  representation_used: string;
  model_used: string;
  predicted_value: number;
  experimental_value: number | null;
  units: string;
  directionality: string;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  feature_contributions: FeatureContribution[];
  interpretation: string;
}

export interface PositionalSaliencyItem {
  position: number;
  residue: string;
  mean_mutational_impact: number;
  num_sampled_mutants: number;
  rsa: number;
  secondary_structure: string;
  is_hotspot: boolean;
}

export interface PositionalSaliencyResponse {
  protein_id: string;
  sequence_length: number;
  positional_profile: PositionalSaliencyItem[];
}
