import React, { useState, useRef, useEffect } from 'react';
import { StructureData } from '../../types';
import { Badge } from '../common/Badge';

interface ContactMapViewerProps {
  structure: StructureData | null;
  highlightPosition?: number | null;
}

export const ContactMapViewer: React.FC<ContactMapViewerProps> = ({
  structure,
  highlightPosition
}) => {
  const [cutoff, setCutoff] = useState<number>(8.0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPair, setHoveredPair] = useState<{ i: number; j: number; dist: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !structure || !structure.distance_matrix.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const n = structure.length;
    const size = canvas.width;
    const cellSize = size / n;
    const dists = structure.distance_matrix;

    ctx.clearRect(0, 0, size, size);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const d = dists[i][j];
        const isContact = d < cutoff && d > 0.01;

        if (isContact) {
          const intensity = Math.max(0.15, 1.0 - d / cutoff);
          ctx.fillStyle = `rgba(216, 255, 79, ${intensity})`;
          ctx.fillRect(i * cellSize, j * cellSize, Math.max(1, cellSize), Math.max(1, cellSize));
        } else if (i === j) {
          ctx.fillStyle = '#3A3935';
          ctx.fillRect(i * cellSize, j * cellSize, Math.max(1, cellSize), Math.max(1, cellSize));
        }
      }
    }

    if (highlightPosition && highlightPosition <= n) {
      const pIdx = highlightPosition - 1;
      ctx.strokeStyle = '#D8FF4F';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(pIdx * cellSize, 0);
      ctx.lineTo(pIdx * cellSize, size);
      ctx.moveTo(0, pIdx * cellSize);
      ctx.lineTo(size, pIdx * cellSize);
      ctx.stroke();
    }
  }, [structure, cutoff, highlightPosition]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !structure) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const n = structure.length;
    const cellSize = canvas.width / n;

    const i = Math.floor(x / cellSize);
    const j = Math.floor(y / cellSize);

    if (i >= 0 && i < n && j >= 0 && j < n) {
      const dist = structure.distance_matrix[i][j];
      setHoveredPair({ i: i + 1, j: j + 1, dist });
    }
  };

  const handleMouseLeave = () => {
    setHoveredPair(null);
  };

  if (!structure) return null;

  let totalContacts = 0;
  let totalSeqDist = 0;
  const n = structure.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (structure.distance_matrix[i][j] < cutoff) {
        totalContacts++;
        totalSeqDist += Math.abs(i - j);
      }
    }
  }
  const contactDensity = (totalContacts * 2) / (n * n);
  const relativeContactOrder = totalContacts > 0 ? (totalSeqDist / totalContacts / n) * 100 : 0;

  return (
    <div className="panel-dark">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '12px' }}>
        <div>
          <span className="hero-label" style={{ color: 'var(--accent)' }}>2D TOPOLOGY</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <h3 style={{ fontSize: '1.25rem' }}>Residue Contact Matrix</h3>
            <Badge variant="dark">{totalContacts} Contacts</Badge>
          </div>
        </div>

        {/* Cutoff slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1c1b18', padding: '6px 12px', borderRadius: '2px', border: '1px solid var(--border-dark)' }}>
          <span className="mono" style={{ fontSize: '0.75rem', color: '#a3a199' }}>
            CUTOFF: <strong style={{ color: 'var(--accent)' }}>{cutoff.toFixed(1)} Å</strong>
          </span>
          <input
            type="range"
            min="4.0"
            max="14.0"
            step="0.5"
            value={cutoff}
            onChange={(e) => setCutoff(parseFloat(e.target.value))}
            style={{ width: '80px', accentColor: 'var(--accent)', cursor: 'pointer' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'center' }}>
        {/* Canvas Contact Matrix */}
        <div style={{ width: '320px', height: '320px', background: '#0D0D0C', borderRadius: '2px', border: '1px solid var(--border-dark)', padding: '6px' }}>
          <canvas
            ref={canvasRef}
            width={308}
            height={308}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ width: '100%', height: '100%', cursor: 'crosshair', display: 'block' }}
          />
        </div>

        {/* Metrics Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#181714', padding: '16px', border: '1px solid var(--border-dark)', borderRadius: '2px' }}>
            <span className="hero-label" style={{ color: 'var(--text-muted)' }}>GRAPH TOPOLOGY METRICS</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px' }}>
              <div>
                <div className="mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>CONTACT DENSITY</div>
                <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--white)' }}>
                  {(contactDensity * 100).toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>CONTACT ORDER</div>
                <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent)' }}>
                  {relativeContactOrder.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: '#181714', padding: '16px', border: '1px solid var(--border-dark)', borderRadius: '2px', minHeight: '80px' }}>
            <span className="hero-label" style={{ color: 'var(--text-muted)' }}>PAIR INSPECTOR</span>
            {hoveredPair ? (
              <div style={{ marginTop: '6px' }}>
                <div className="mono" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--white)' }}>
                  RESIDUE {hoveredPair.i} ↔ RESIDUE {hoveredPair.j}
                </div>
                <div className="mono" style={{ fontSize: '0.75rem', color: hoveredPair.dist < cutoff ? 'var(--accent)' : 'var(--text-muted)', marginTop: '2px' }}>
                  DISTANCE: {hoveredPair.dist.toFixed(2)} Å ({hoveredPair.dist < cutoff ? 'IN CONTACT' : 'NO CONTACT'})
                </div>
              </div>
            ) : (
              <p className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Hover over matrix cells to inspect pairwise spatial proximity.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
