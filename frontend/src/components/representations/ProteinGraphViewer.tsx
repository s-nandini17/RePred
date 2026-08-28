import React, { useEffect, useRef } from 'react';
import { StructureData } from '../../types';
import { Badge } from '../common/Badge';

interface ProteinGraphViewerProps {
  structure: StructureData | null;
  highlightPosition?: number | null;
}

export const ProteinGraphViewer: React.FC<ProteinGraphViewerProps> = ({
  structure,
  highlightPosition
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !structure || !structure.coordinates.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;

    ctx.clearRect(0, 0, width, height);

    const n = structure.length;
    const radius = Math.min(width, height) * 0.38;

    const nodePositions: { x: number; y: number; idx: number; aa: string; ss: string }[] = [];
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      const r = radius + (structure.rsa[i] ? (structure.rsa[i] - 0.5) * 30 : 0);
      nodePositions.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        idx: i + 1,
        aa: structure.sequence[i],
        ss: structure.secondary_structure[i] || 'C'
      });
    }

    // 1. Spatial contact chords (< 8.0 A)
    ctx.lineWidth = 0.6;
    for (let i = 0; i < n; i++) {
      for (let j = i + 2; j < n; j++) {
        const d = structure.distance_matrix[i][j];
        if (d < 8.0) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(216, 255, 79, 0.12)';
          ctx.moveTo(nodePositions[i].x, nodePositions[i].y);
          ctx.quadraticCurveTo(cx, cy, nodePositions[j].x, nodePositions[j].y);
          ctx.stroke();
        }
      }
    }

    // 2. Sequential backbone ring
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#4A4842';
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const p = nodePositions[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    // 3. Residue nodes
    for (const node of nodePositions) {
      ctx.beginPath();
      const isSelected = highlightPosition === node.idx;
      const r = isSelected ? 5.5 : 2.2;

      let fill = '#6E6C65';
      if (isSelected) {
        fill = '#D8FF4F';
      } else if (node.ss === 'H') {
        fill = '#F8F7F2';
      } else if (node.ss === 'E') {
        fill = '#A8A69E';
      }

      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
      ctx.fillStyle = fill;
      ctx.fill();
    }
  }, [structure, highlightPosition]);

  if (!structure) return null;

  return (
    <div className="panel-dark">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '12px' }}>
        <div>
          <span className="hero-label" style={{ color: 'var(--accent)' }}>GRAPH TOPOLOGY</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <h3 style={{ fontSize: '1.25rem' }}>Residue Interaction Graph</h3>
            <Badge variant="dark">{structure.length} Nodes</Badge>
          </div>
        </div>
      </div>

      <div
        style={{
          width: '100%',
          height: '320px',
          background: '#0D0D0C',
          borderRadius: '2px',
          border: '1px solid var(--border-dark)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        <canvas ref={canvasRef} width={500} height={310} style={{ width: '100%', height: '100%' }} />

        <div
          className="mono"
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            background: 'rgba(17, 17, 15, 0.9)',
            border: '1px solid var(--border-dark)',
            padding: '4px 10px',
            borderRadius: '2px',
            fontSize: '0.6875rem',
            color: 'var(--text-muted)'
          }}
        >
          Inner chords: Spatial proximity (&lt;8Å) | Ring: Backbone chain
        </div>
      </div>
    </div>
  );
};
