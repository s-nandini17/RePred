import React, { useState } from 'react';
import { PredictionResponse, FeatureContribution } from '../../types';
import { ApiService } from '../../services/api';
import { Badge } from '../common/Badge';
import { Play, RefreshCw, AlertCircle } from 'lucide-react';

interface PredictionWorkbenchProps {
  proteinId: string;
  taskId: string;
  defaultMutation?: string;
}

export const PredictionWorkbench: React.FC<PredictionWorkbenchProps> = ({
  proteinId,
  taskId,
  defaultMutation = 'M182T'
}) => {
  const [mutationInput, setMutationInput] = useState<string>(defaultMutation);
  const [selectedRep, setSelectedRep] = useState<string>('all_multimodal');
  const [selectedModel, setSelectedModel] = useState<string>('gradient_boosting');
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const representations = [
    { id: 'all_multimodal', name: 'All-Modality Hybrid (189D)' },
    { id: 'esm', name: 'Learned ESM-2 Embedding (75D)' },
    { id: 'seq_struct_hybrid', name: 'Seq + Struct Hybrid (97D)' },
    { id: 'graph', name: 'Protein Graph (45D)' },
    { id: 'sequence', name: 'Sequence (75D)' },
    { id: 'structure', name: '3D Structure (22D)' },
    { id: 'contact_map', name: 'Contact Map (17D)' }
  ];

  const models = [
    { id: 'gradient_boosting', name: 'Gradient Boosted Trees (GBM)' },
    { id: 'random_forest', name: 'Random Forest' },
    { id: 'neural_network', name: 'Deep Neural Network (MLP)' },
    { id: 'gnn', name: 'PyTorch Graph Neural Network (GNN)' },
    { id: 'ridge', name: 'Ridge Regression' }
  ];

  const handlePredict = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mutationInput.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await ApiService.predictMutation({
        protein_id: proteinId,
        task_id: taskId,
        mutation: mutationInput.trim().toUpperCase(),
        representation_id: selectedRep,
        model_name: selectedModel
      });
      setPrediction(res);
    } catch (err: any) {
      console.error('Prediction failed:', err);
      setError(err.message || 'Failed to generate prediction');
    } finally {
      setLoading(false);
    }
  };

  const residual = prediction && prediction.experimental_value !== null
    ? Math.abs(prediction.predicted_value - prediction.experimental_value)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Section Header */}
      <div className="section-header">
        <div>
          <span className="hero-label">MUTATION EFFECT PREDICTION</span>
          <h2 className="section-title">Prediction Workbench</h2>
          <p className="section-subtitle">
            Evaluate variant effect predictions for single substitutions across distinct representations and model families.
          </p>
        </div>
      </div>

      {/* Input Workbench Form */}
      <div className="panel-light">
        <form onSubmit={handlePredict} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
          {/* Mutation String */}
          <div>
            <label className="hero-label" style={{ display: 'block', marginBottom: '6px' }}>
              MUTATION (E.G. M182T)
            </label>
            <input
              type="text"
              value={mutationInput}
              onChange={(e) => setMutationInput(e.target.value.toUpperCase())}
              placeholder="e.g. M182T, A42V..."
              className="mono"
              style={{ width: '100%', fontWeight: 600, fontSize: '0.9375rem' }}
            />
          </div>

          {/* Representation Selector */}
          <div>
            <label className="hero-label" style={{ display: 'block', marginBottom: '6px' }}>
              REPRESENTATION
            </label>
            <select
              value={selectedRep}
              onChange={(e) => setSelectedRep(e.target.value)}
              style={{ width: '100%' }}
            >
              {representations.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Model Architecture Selector */}
          <div>
            <label className="hero-label" style={{ display: 'block', marginBottom: '6px' }}>
              MODEL ARCHITECTURE
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{ width: '100%' }}
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Run Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', height: '40px' }}
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Computing...
                </>
              ) : (
                <>
                  <Play size={14} fill="currentColor" /> Run Prediction
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#e11d48', fontSize: '0.8125rem' }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}
      </div>

      {/* Prediction Output Results */}
      {prediction && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Main Output Box */}
          <div className="panel-dark">
            <span className="hero-label" style={{ color: 'var(--accent)' }}>PREDICTION OUTPUT</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '12px', marginBottom: '8px' }}>
              <span className="mono" style={{ fontSize: '3.5rem', fontWeight: 600, color: 'var(--white)', lineHeight: '1' }}>
                {prediction.predicted_value.toFixed(3)}
              </span>
              <span className="mono" style={{ fontSize: '0.875rem', color: '#c5c3bc' }}>
                {prediction.units}
              </span>
            </div>

            {prediction.confidence_interval && (
              <div className="mono" style={{ fontSize: '0.8125rem', color: '#a3a199', marginTop: '8px' }}>
                95% CONFIDENCE INTERVAL: [{prediction.confidence_interval.lower.toFixed(3)}, {prediction.confidence_interval.upper.toFixed(3)}]
              </div>
            )}

            {/* Experimental Comparison if available */}
            {prediction.experimental_value !== null && prediction.experimental_value !== undefined && (
              <div style={{ marginTop: '20px', padding: '14px', background: '#1c1b18', borderRadius: '2px', border: '1px solid var(--border-dark)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="hero-label" style={{ color: 'var(--accent)' }}>EXPERIMENTAL GROUND TRUTH</span>
                  <Badge variant="dark">Assay Validated</Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '8px' }}>
                  <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--white)' }}>
                    {prediction.experimental_value.toFixed(3)} {prediction.units}
                  </span>
                  <span className="mono" style={{ fontSize: '0.8125rem', color: residual !== null && residual < 0.5 ? 'var(--accent)' : '#fb7185' }}>
                    RESIDUAL |Δ| = {residual !== null ? residual.toFixed(3) : '—'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Feature Attribution Waterfall */}
          <div className="panel-light">
            <span className="hero-label">FEATURE ATTRIBUTION</span>
            <h3 style={{ fontSize: '1.125rem', marginTop: '2px', marginBottom: '16px' }}>Top Biophysical Feature Contributions</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(prediction.feature_contributions || []).map((feat: FeatureContribution) => {
                const isPositive = feat.contribution_direction === 'positive' || feat.feature_value >= 0;
                const widthPercent = Math.min(100, Math.abs(feat.importance_weight) * 100);

                return (
                  <div key={feat.feature_name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px' }}>
                      <span className="mono" style={{ fontWeight: 500 }}>{feat.feature_name}</span>
                      <span className="mono" style={{ color: isPositive ? 'var(--text-primary)' : '#e11d48', fontWeight: 600 }}>
                        {feat.importance_weight.toFixed(3)} ({feat.category})
                      </span>
                    </div>
                    <div className="score-track">
                      <div
                        className="score-fill"
                        style={{
                          width: `${widthPercent}%`,
                          background: isPositive ? 'var(--text-primary)' : '#f43f5e'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
