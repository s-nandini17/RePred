import React from 'react';
import { ScoreCard } from '../../types';
import { Badge } from '../common/Badge';
import { X } from 'lucide-react';

interface ScoreExplanationModalProps {
  card: ScoreCard | null;
  onClose: () => void;
}

export const ScoreExplanationModal: React.FC<ScoreExplanationModalProps> = ({
  card,
  onClose
}) => {
  if (!card) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(13, 13, 12, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="panel-dark"
        style={{
          maxWidth: '640px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          border: '1px solid var(--border-dark)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-dark)', paddingBottom: '14px', marginBottom: '18px' }}>
          <div>
            <span className="hero-label" style={{ color: 'var(--accent)' }}>SCIENTIFIC RATIONALE</span>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--white)', marginTop: '2px' }}>
              {card.representation_name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn-dark"
            style={{ padding: '6px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Score Display */}
        <div style={{ background: '#1c1b18', padding: '16px', borderRadius: '2px', border: '1px solid var(--border-dark)', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>NORMALIZED SCORE</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
              <span className="mono" style={{ fontSize: '2.25rem', fontWeight: 600, color: 'var(--accent)' }}>
                {card.final_score.toFixed(1)}
              </span>
              <span className="mono" style={{ fontSize: '1rem', color: '#c5c3bc' }}>
                / 10
              </span>
            </div>
          </div>
          <Badge variant="dark">{card.normalization_method}</Badge>
        </div>

        {/* Formula Section */}
        <div style={{ marginBottom: '18px' }}>
          <span className="hero-label" style={{ color: 'var(--text-muted)' }}>MATHEMATICAL NORMALIZATION METHOD</span>
          <div className="mono" style={{ background: '#0D0D0C', padding: '12px 14px', borderRadius: '2px', fontSize: '0.8125rem', color: 'var(--white)', border: '1px solid var(--border-dark)', marginTop: '6px' }}>
            Primary Metric: {card.primary_metric} = {card.raw_value.toFixed(3)} | Ideal Benchmark: {card.ideal_benchmark.toFixed(3)}
            <br />
            Score = (Raw - Baseline) / (Ideal - Baseline) × 10 = {card.final_score.toFixed(1)} / 10
          </div>
        </div>

        {/* Natural Language Explanation */}
        <div style={{ marginBottom: '18px' }}>
          <span className="hero-label" style={{ color: 'var(--text-muted)' }}>BIOPHYSICAL RATIONALE</span>
          <p style={{ fontSize: '0.8125rem', color: '#c5c3bc', marginTop: '6px', lineHeight: '1.6' }}>
            {card.explanation}
          </p>
        </div>

        {/* Ideal Benchmark Disclaimer */}
        <div style={{ background: '#141412', padding: '12px 14px', borderRadius: '2px', border: '1px solid var(--border-dark)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--white)' }}>What /10 Means:</strong> A score of 10.0 represents performance matching the predefined ideal benchmark (Spearman ρ = 1.000) on this specific experimental assay under 5-fold cross-validation.
        </div>
      </div>
    </div>
  );
};
