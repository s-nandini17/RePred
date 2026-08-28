/**
 * API client for the Protein Representation Benchmark Dashboard.
 */

import {
  ProteinSummary,
  ProteinDetails,
  StructureData,
  MutationRecord,
  RepresentationInfo,
  BenchmarkResponse,
  PredictionResponse,
  PositionalSaliencyResponse
} from '../types';

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
  ? import.meta.env.VITE_API_BASE_URL
  : 'http://127.0.0.1:8000';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    }
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown network error');
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }
  return response.json();
}

export const ApiService = {
  async getProteins(): Promise<ProteinSummary[]> {
    return fetchJson<ProteinSummary[]>('/proteins');
  },

  async getProteinDetails(proteinId: string): Promise<ProteinDetails> {
    return fetchJson<ProteinDetails>(`/proteins/${proteinId}`);
  },

  async getProteinStructure(proteinId: string): Promise<StructureData> {
    return fetchJson<StructureData>(`/proteins/${proteinId}/structure`);
  },

  async getMutations(
    proteinId: string,
    params?: {
      dataset_id?: string;
      position?: number;
      wt_residue?: string;
      mutant_residue?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ protein_id: string; total_count: number; mutations: MutationRecord[] }> {
    const query = new URLSearchParams();
    if (params?.dataset_id) query.append('dataset_id', params.dataset_id);
    if (params?.position !== undefined) query.append('position', String(params.position));
    if (params?.wt_residue) query.append('wt_residue', params.wt_residue);
    if (params?.mutant_residue) query.append('mutant_residue', params.mutant_residue);
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.offset) query.append('offset', String(params.offset));

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchJson<{ protein_id: string; total_count: number; mutations: MutationRecord[] }>(
      `/mutations/${proteinId}${queryString}`
    );
  },

  async getRepresentations(proteinId: string): Promise<RepresentationInfo[]> {
    return fetchJson<RepresentationInfo[]>(`/proteins/${proteinId}/representations`);
  },

  async getBenchmark(
    proteinId: string,
    taskId: string,
    modelName: string = 'gradient_boosting',
    datasetId?: string
  ): Promise<BenchmarkResponse> {
    const query = new URLSearchParams();
    query.append('model', modelName);
    if (datasetId) query.append('dataset_id', datasetId);

    return fetchJson<BenchmarkResponse>(`/benchmark/${proteinId}/${taskId}?${query.toString()}`);
  },

  async predictMutation(params: {
    protein_id: string;
    task_id: string;
    mutation: string;
    representation_id: string;
    model_name: string;
  }): Promise<PredictionResponse> {
    return fetchJson<PredictionResponse>('/predict', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  async getPositionalSaliency(proteinId: string): Promise<PositionalSaliencyResponse> {
    return fetchJson<PositionalSaliencyResponse>(`/explain/saliency/${proteinId}`);
  },

  async getScoringConfig(): Promise<any> {
    return fetchJson<any>('/config/scoring');
  }
};
