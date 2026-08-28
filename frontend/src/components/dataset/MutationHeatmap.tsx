import React, { useState } from 'react';
import { MutationRecord } from '../../types';

interface MutationHeatmapProps {
  mutations: MutationRecord[];
  sequenceLength: number;
  onSelectMutation?: (mutationStr: string) => void;
}

const AMINO_ACIDS = ['A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'Y'];

export const MutationHeatmap: React.FC<MutationHeatmapProps> = ({
  mutations,
  sequenceLength,
  onSelectMutation
}) => {
  const [hoveredCell, setHoveredCell] = useState<{ pos: number; mutAA: string; val: number; wt: string } | null>(null);

  const mutMap = new Map<string, { val: number; wt: string }>();
  let minVal = 0;
  let maxVal = 0;

  if (mutations.length) {
    minVal = mutations[0].measurement;
    maxVal = mutations[0].measurement;
    mutations.forEach((m) => {
      mutMap.set(`${m.position}_${m.mutant_residue}`, { val: m.measurement, wt: m.wt_residue });
      if (m.measurement < minVal) minVal = m.measurement;
      if (m.measurement > maxVal) maxVal = m.measurement;
    });
  }

  const numPositions = Math.min(sequenceLength, 200);

  const getColor = (val: number | undefined) => {
    if (val === undefined) return '#1A1916';
    if (val >= 0) {
      const norm = maxVal > 0 ? Math.min(1, val / maxVal) : 0;
      return `rgba(216, 255, 79, ${0.2 + norm * 0.8})`;
    } else {
      const norm = minVal < 0 ? Math.min(1, val / minVal) : 0;
      return `rgba(244, 63, 94, ${0.2 + norm * 0.8})`;
    }
  };

  return (
    <div className="panel-dark">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '10px' }}>
        <div>
          <span className="hero-label" style={{ color: 'var(--accent)' }}>MUTATIONAL LANDSCAPE</span>
          <h4 style={{ fontSize: '1rem', color: 'var(--white)', marginTop: '2px' }}>20 × N Deep Mutational Scanning Matrix</h4>
        </div>
        <div className="mono" style={{ fontSize: '0.75rem', color: '#c5c3bc', display: 'flex', gap: '16px' }}>
          <span><strong style={{ color: 'var(--accent)' }}>Chartreuse:</strong> Beneficial / Stable</span>
          <span><strong style={{ color: '#fb7185' }}>Rose:</strong> Deleterious</span>
        </div>
      </div>

      {/* Heatmap Matrix Grid */}
      <div
        style={{
          width: '100%',
          overflowX: 'auto',
          background: '#0D0D0C',
          borderRadius: '2px',
          border: '1px solid var(--border-dark)',
          padding: '12px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: `${numPositions * 14 + 40}px` }}>
          {AMINO_ACIDS.map((aa) => (
            <div key={aa} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <span className="mono" style={{ width: '24px', fontSize: '0.6875rem', color: '#8E8C84', textAlign: 'center', fontWeight: 600 }}>
                {aa}
              </span>
              {Array.from({ length: numPositions }, (_, idx) => {
                const pos = idx + 1;
                const entry = mutMap.get(`${pos}_${aa}`);
                const hasData = entry !== undefined;
                const bg = getColor(entry?.val);

                return (
                  <div
                    key={pos}
                    onMouseEnter={() => {
                      if (hasData) {
                        setHoveredCell({ pos, mutAA: aa, val: entry.val, wt: entry.wt });
                      }
                    }}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => {
                      if (hasData && onSelectMutation) {
                        onSelectMutation(`${entry.wt}${pos}${aa}`);
                      }
                    }}
                    style={{
                      width: '11px',
                      height: '11px',
                      backgroundColor: bg,
                      borderRadius: '1px',
                      cursor: hasData ? 'pointer' : 'default',
                      transition: 'transform 0.1s ease',
                      border: entry?.wt === aa ? '1px solid #ffffff' : 'none'
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Hover Inspector */}
      <div
        className="mono"
        style={{
          marginTop: '10px',
          minHeight: '24px',
          fontSize: '0.75rem',
          color: '#c5c3bc'
        }}
      >
        {hoveredCell ? (
          <span style={{ color: 'var(--white)' }}>
            MUTATION <strong style={{ color: 'var(--accent)' }}>{hoveredCell.wt}{hoveredCell.pos}{hoveredCell.mutAA}</strong>: MEASURED VALUE = <strong style={{ color: hoveredCell.val >= 0 ? 'var(--accent)' : '#fb7185' }}>{hoveredCell.val.toFixed(3)}</strong> (Click to Predict in Lab)
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>
            Hover over matrix cells to inspect mutational effect. White borders indicate wild-type identity.
          </span>
        )}
      </div>
    </div>
  );
};
