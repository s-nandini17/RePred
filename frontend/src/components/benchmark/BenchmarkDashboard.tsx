import React, { useState, useEffect } from 'react';
import { BenchmarkResponse, ScoreCard } from '../../types';
import { ApiService } from '../../services/api';
import { RadarComparisonChart } from './RadarComparisonChart';
import { ScoreExplanationModal } from './ScoreExplanationModal';
import { Badge } from '../common/Badge';
import { RefreshCw, HelpCircle } from 'lucide-react';

interface BenchmarkDashboardProps {
  proteinId: string;
  taskId: string;
}

export const BenchmarkDashboard: React.FC<BenchmarkDashboardProps> = ({
  proteinId,
  taskId
}) => {
  const [benchmark, setBenchmark] = useState<BenchmarkResponse | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('gradient_boosting');
  const [loading, setLoading] = useState<boolean>(true);
  const [activeModalCard, setActiveModalCard] = useState<ScoreCard | null>(null);

  const models = [
    { id: 'gradient_boosting', name: 'Gradient Boosted Trees (GBM)' },
    { id: 'random_forest', name: 'Random Forest' },
    { id: 'neural_network', name: 'Deep Neural Network (MLP)' },
    { id: 'gnn', name: 'PyTorch Graph Neural Network (GNN)' },
    { id: 'ridge', name: 'Ridge Regression' }
  ];

  useEffect(() => {
    setLoading(true);
    ApiService.getBenchmark(proteinId, taskId, selectedModel)
      .then((res) => {
        setBenchmark(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load benchmark:', err);
        setLoading(false);
      });
  }, [proteinId, taskId, selectedModel]);

  if (loading) {
    return (
      <div className="panel-light" style={{ padding: '60px', textAlign: 'center' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--text-muted)' }} />
        <div className="mono" style={{ fontSize: '0.875rem' }}>Running 5-Fold Cross-Validation Benchmark across all Modalities...</div>
      </div>
    );
  }

  if (!benchmark) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Section Header */}
      <div className="section-header">
        <div>
          <span className="hero-label">EMPIRICAL BENCHMARK</span>
          <h2 className="section-title">Representation Benchmark Leaderboard</h2>
          <p className="section-subtitle">
            5-Fold Cross-Validation on held-out experimental mutations ({benchmark.dataset_id} &bull; N={benchmark.sample_count})
          </p>
        </div>

        {/* Model Evaluated Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>EVALUATOR MODEL:</span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            style={{ fontWeight: 500 }}
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top 3 Scorecards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {benchmark.leaderboard.slice(0, 3).map((card, idx) => (
          <div
            key={card.representation_id}
            className={idx === 0 ? 'panel-dark' : 'panel-light'}
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Badge variant={idx === 0 ? 'accent' : 'neutral'}>Rank #{idx + 1}</Badge>
                <button
                  onClick={() => setActiveModalCard(card)}
                  className={idx === 0 ? 'btn-dark' : 'btn-secondary'}
                  style={{ padding: '3px 8px', fontSize: '0.6875rem' }}
                >
                  <HelpCircle size={10} /> Explain
                </button>
              </div>

              <h3 style={{ fontSize: '1.25rem', marginTop: '10px', marginBottom: '2px', color: idx === 0 ? 'var(--white)' : 'var(--text-primary)' }}>
                {card.representation_name}
              </h3>
              <p style={{ fontSize: '0.75rem', color: idx === 0 ? '#A8A69E' : 'var(--text-secondary)', marginBottom: '16px' }}>
                {card.representation_id.includes('hybrid') ? 'Multi-Modal Fusion' : 'Single Modality'}
              </p>

              {/* Large Score */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                <span className="mono" style={{ fontSize: '2.75rem', fontWeight: 600, color: idx === 0 ? 'var(--accent)' : 'var(--text-primary)', lineHeight: '1' }}>
                  {card.final_score.toFixed(1)}
                </span>
                <span className="mono" style={{ fontSize: '0.875rem', color: idx === 0 ? '#A8A69E' : 'var(--text-muted)' }}>
                  / 10
                </span>
              </div>

              {/* Score Progress Track */}
              <div className={`score-track ${idx === 0 ? 'score-track-dark' : ''}`} style={{ marginBottom: '14px' }}>
                <div
                  className={`score-fill ${idx === 0 ? 'score-fill-accent' : ''}`}
                  style={{ width: `${(card.final_score / 10) * 100}%` }}
                />
              </div>
            </div>

            {/* Bottom Metrics Line */}
            <div
              className="mono"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                paddingTop: '10px',
                borderTop: idx === 0 ? '1px solid var(--border-dark)' : '1px solid var(--border)',
                fontSize: '0.6875rem',
                color: idx === 0 ? '#c5c3bc' : 'var(--text-secondary)'
              }}
            >
              <div>
                <div>Spearman ρ</div>
                <strong style={{ color: idx === 0 ? 'var(--white)' : 'var(--text-primary)', fontSize: '0.8125rem' }}>
                  {(card.all_metrics?.spearman_rho || 0).toFixed(3)}
                </strong>
              </div>
              <div>
                <div>Pearson r</div>
                <strong style={{ color: idx === 0 ? 'var(--white)' : 'var(--text-primary)', fontSize: '0.8125rem' }}>
                  {(card.all_metrics?.pearson_r || 0).toFixed(3)}
                </strong>
              </div>
              <div>
                <div>RMSE</div>
                <strong style={{ color: idx === 0 ? 'var(--white)' : 'var(--text-primary)', fontSize: '0.8125rem' }}>
                  {(card.all_metrics?.rmse || 0).toFixed(3)}
                </strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Radar Chart */}
      <RadarComparisonChart leaderboard={benchmark.leaderboard} />

      {/* Full Leaderboard Table */}
      <div className="panel-light" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
          <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
            COMPLETE REPRESENTATION BENCHMARK TABLE
          </span>
        </div>

        <table className="editorial-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Representation</th>
              <th>Score / 10</th>
              <th>Spearman ρ</th>
              <th>Pearson r</th>
              <th>RMSE</th>
              <th>MAE</th>
              <th>R²</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {benchmark.leaderboard.map((card, idx) => (
              <tr key={card.representation_id}>
                <td className="mono">
                  <Badge variant={idx === 0 ? 'accent' : 'neutral'}>#{idx + 1}</Badge>
                </td>
                <td style={{ fontWeight: 500 }}>{card.representation_name}</td>
                <td className="mono" style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                  {card.final_score.toFixed(1)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ 10</span>
                </td>
                <td className="mono">{(card.all_metrics?.spearman_rho || 0).toFixed(3)}</td>
                <td className="mono">{(card.all_metrics?.pearson_r || 0).toFixed(3)}</td>
                <td className="mono">{(card.all_metrics?.rmse || 0).toFixed(3)}</td>
                <td className="mono">{(card.all_metrics?.mae || 0).toFixed(3)}</td>
                <td className="mono">{(card.all_metrics?.r2 || 0).toFixed(3)}</td>
                <td>
                  <button
                    onClick={() => setActiveModalCard(card)}
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.6875rem' }}
                  >
                    Explain Why
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Score Explanation Modal */}
      <ScoreExplanationModal
        card={activeModalCard}
        onClose={() => setActiveModalCard(null)}
      />
    </div>
  );
};
