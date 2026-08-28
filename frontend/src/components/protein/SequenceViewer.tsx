import React, { useState } from 'react';
import { Badge } from '../common/Badge';

interface SequenceViewerProps {
  sequence: string;
  rsa?: number[];
  secondaryStructure?: string[];
  onSelectPosition?: (pos: number) => void;
  selectedPosition?: number | null;
}

const AA_NAMES: Record<string, string> = {
  A: 'Ala', C: 'Cys', D: 'Asp', E: 'Glu', F: 'Phe',
  G: 'Gly', H: 'His', I: 'Ile', K: 'Lys', L: 'Leu',
  M: 'Met', N: 'Asn', P: 'Pro', Q: 'Gln', R: 'Arg',
  S: 'Ser', T: 'Thr', V: 'Val', W: 'Trp', Y: 'Tyr'
};

export const SequenceViewer: React.FC<SequenceViewerProps> = ({
  sequence,
  rsa,
  secondaryStructure,
  onSelectPosition,
  selectedPosition
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const chunkSize = 50;
  const chunks: string[] = [];
  for (let i = 0; i < sequence.length; i += chunkSize) {
    chunks.push(sequence.slice(i, i + chunkSize));
  }

  const currentHover = hoveredIdx !== null ? {
    pos: hoveredIdx + 1,
    aa: sequence[hoveredIdx],
    name: AA_NAMES[sequence[hoveredIdx]] || sequence[hoveredIdx],
    rsaVal: rsa && rsa[hoveredIdx] !== undefined ? rsa[hoveredIdx] : null,
    ssVal: secondaryStructure && secondaryStructure[hoveredIdx] ? secondaryStructure[hoveredIdx] : null
  } : null;

  return (
    <div className="panel-light">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        <div>
          <span className="hero-label">PRIMARY SEQUENCE</span>
          <h3 style={{ fontSize: '1.25rem', marginTop: '2px' }}>Amino Acid Chain</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="mono" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            LENGTH: <strong style={{ color: 'var(--text-primary)' }}>{sequence.length}</strong> AA
          </span>
          <Badge variant="neutral">FASTA</Badge>
        </div>
      </div>

      {/* Sequence Matrix Grid */}
      <div
        className="mono"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '2px',
          padding: '18px 20px',
          maxHeight: '260px',
          overflowY: 'auto',
          fontSize: '0.8125rem',
          lineHeight: '2.1',
          letterSpacing: '0.04em'
        }}
      >
        {chunks.map((chunk, chunkIdx) => {
          const startPos = chunkIdx * chunkSize + 1;
          return (
            <div key={chunkIdx} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '4px' }}>
              <span style={{ width: '40px', color: 'var(--text-muted)', fontSize: '0.6875rem', textAlign: 'right' }}>
                {startPos}
              </span>
              <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
                {chunk.split('').map((aa, idx) => {
                  const globalIdx = chunkIdx * chunkSize + idx;
                  const pos = globalIdx + 1;
                  const isSelected = selectedPosition === pos;

                  return (
                    <span
                      key={globalIdx}
                      id={`res-${pos}`}
                      onMouseEnter={() => setHoveredIdx(globalIdx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      onClick={() => onSelectPosition && onSelectPosition(pos)}
                      className={`aa-pill ${isSelected ? 'selected' : ''}`}
                    >
                      {aa}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Residue Inspector Line */}
      <div
        style={{
          marginTop: '12px',
          minHeight: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)'
        }}
      >
        {currentHover ? (
          <>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              RESIDUE {currentHover.pos}: {currentHover.name} ({currentHover.aa})
            </span>
            {currentHover.rsaVal !== null && (
              <span>
                RSA: <strong style={{ color: 'var(--text-primary)' }}>{(currentHover.rsaVal * 100).toFixed(1)}%</strong> ({currentHover.rsaVal < 0.2 ? 'Buried Core' : 'Surface Exposed'})
              </span>
            )}
            {currentHover.ssVal && (
              <span>
                SECONDARY STRUCTURE: <strong style={{ color: 'var(--text-primary)' }}>{currentHover.ssVal === 'H' ? 'Alpha Helix' : currentHover.ssVal === 'E' ? 'Beta Sheet' : 'Coil / Loop'}</strong>
              </span>
            )}
          </>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>
            Hover or click on any amino acid to inspect residue solvent accessibility and secondary structure.
          </span>
        )}
      </div>
    </div>
  );
};
