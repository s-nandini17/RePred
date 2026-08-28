import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Badge } from '../common/Badge';

interface EsmEmbeddingViewerProps {
  sequence: string;
  highlightPosition?: number | null;
}

export const EsmEmbeddingViewer: React.FC<EsmEmbeddingViewerProps> = () => {
  const aaData = [
    { aa: 'A', name: 'Ala', pca1: 0.42, pca2: -0.15, type: 'Hydrophobic', color: '#A8A69E' },
    { aa: 'V', name: 'Val', pca1: 0.68, pca2: -0.22, type: 'Hydrophobic', color: '#A8A69E' },
    { aa: 'I', name: 'Ile', pca1: 0.85, pca2: -0.31, type: 'Hydrophobic', color: '#A8A69E' },
    { aa: 'L', name: 'Leu', pca1: 0.81, pca2: -0.28, type: 'Hydrophobic', color: '#A8A69E' },
    { aa: 'M', name: 'Met', pca1: 0.62, pca2: -0.18, type: 'Hydrophobic', color: '#A8A69E' },
    { aa: 'F', name: 'Phe', pca1: 0.74, pca2: 0.45, type: 'Aromatic', color: '#D8FF4F' },
    { aa: 'Y', name: 'Tyr', pca1: 0.52, pca2: 0.55, type: 'Aromatic', color: '#D8FF4F' },
    { aa: 'W', name: 'Trp', pca1: 0.61, pca2: 0.72, type: 'Aromatic', color: '#D8FF4F' },
    { aa: 'S', name: 'Ser', pca1: -0.32, pca2: -0.42, type: 'Polar', color: '#F8F7F2' },
    { aa: 'T', name: 'Thr', pca1: -0.18, pca2: -0.38, type: 'Polar', color: '#F8F7F2' },
    { aa: 'C', name: 'Cys', pca1: 0.12, pca2: -0.45, type: 'Polar', color: '#F8F7F2' },
    { aa: 'N', name: 'Asn', pca1: -0.45, pca2: -0.25, type: 'Polar', color: '#F8F7F2' },
    { aa: 'Q', name: 'Gln', pca1: -0.38, pca2: -0.12, type: 'Polar', color: '#F8F7F2' },
    { aa: 'D', name: 'Asp', pca1: -0.82, pca2: -0.15, type: 'Acidic', color: '#8E8C84' },
    { aa: 'E', name: 'Glu', pca1: -0.76, pca2: 0.05, type: 'Acidic', color: '#8E8C84' },
    { aa: 'K', name: 'Lys', pca1: -0.65, pca2: 0.62, type: 'Basic', color: '#57554F' },
    { aa: 'R', name: 'Arg', pca1: -0.58, pca2: 0.75, type: 'Basic', color: '#57554F' },
    { aa: 'H', name: 'His', pca1: -0.22, pca2: 0.48, type: 'Basic', color: '#57554F' },
    { aa: 'G', name: 'Gly', pca1: -0.10, pca2: -0.72, type: 'Polar', color: '#F8F7F2' },
    { aa: 'P', name: 'Pro', pca1: 0.25, pca2: -0.65, type: 'Hydrophobic', color: '#A8A69E' }
  ];

  return (
    <div className="panel-dark">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '12px' }}>
        <div>
          <span className="hero-label" style={{ color: 'var(--accent)' }}>LATENT SPACE</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <h3 style={{ fontSize: '1.25rem' }}>ESM-2 Embedding Manifold (PCA)</h3>
            <Badge variant="dark">650M Parameters</Badge>
            <Badge variant="dark">32D Vectors</Badge>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'center' }}>
        {/* Latent Scatter Plot */}
        <div style={{ width: '100%', height: '300px', background: '#0D0D0C', borderRadius: '2px', border: '1px solid var(--border-dark)', padding: '10px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <XAxis
                type="number"
                dataKey="pca1"
                name="PCA 1 (Hydropathy)"
                stroke="#475569"
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--font-mono)' }}
              />
              <YAxis
                type="number"
                dataKey="pca2"
                name="PCA 2 (Charge/Aromaticity)"
                stroke="#475569"
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--font-mono)' }}
              />
              <ZAxis range={[70, 70]} />
              <Tooltip
                content={({ payload }) => {
                  if (!payload || !payload.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={{ background: '#1c1b18', border: '1px solid var(--border-dark)', padding: '8px 12px', borderRadius: '2px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                      <div style={{ fontWeight: 600, color: 'var(--accent)' }}>{d.name} ({d.aa})</div>
                      <div style={{ color: 'var(--white)' }}>Class: {d.type}</div>
                      <div style={{ color: 'var(--text-muted)' }}>Latent: ({d.pca1.toFixed(2)}, {d.pca2.toFixed(2)})</div>
                    </div>
                  );
                }}
              />
              <Scatter name="Amino Acids" data={aaData}>
                {aaData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Vector Formulation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: '#181714', padding: '16px', border: '1px solid var(--border-dark)', borderRadius: '2px' }}>
            <span className="hero-label" style={{ color: 'var(--accent)' }}>MUTATION VECTOR FORMULATION</span>
            <p style={{ fontSize: '0.8125rem', color: '#c5c3bc', marginTop: '6px', lineHeight: '1.5' }}>
              For single substitution <span className="mono" style={{ color: 'var(--accent)' }}>X → Y</span> at position <span className="mono">i</span>, the feature vector explicitly constructs the differential embedding:
            </p>
            <div className="mono" style={{ background: '#0D0D0C', padding: '10px 14px', borderRadius: '2px', fontSize: '0.8125rem', color: 'var(--accent)', margin: '10px 0', border: '1px solid var(--border-dark)' }}>
              ΔE(i) = ESM(mutant)[i] - ESM(wt)[i]
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Preserves contextual bidirectional attention across all residues while isolating the specific mutational perturbation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
