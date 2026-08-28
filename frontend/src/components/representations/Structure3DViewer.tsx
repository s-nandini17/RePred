import React, { useEffect, useRef, useState } from 'react';
import { StructureData } from '../../types';
import { RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { Badge } from '../common/Badge';

interface Structure3DViewerProps {
  structure: StructureData | null;
  highlightPosition?: number | null;
}

export const Structure3DViewer: React.FC<Structure3DViewerProps> = ({
  structure,
  highlightPosition
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotX, setRotX] = useState(0.4);
  const [rotY, setRotY] = useState(0.6);
  const [zoom, setZoom] = useState(1.0);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !structure || !structure.coordinates.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      if (isAutoRotate && !isDragging) {
        setRotY((prev) => prev + 0.005);
      }

      const coords = structure.coordinates;
      let mx = 0, my = 0, mz = 0;
      for (const [x, y, z] of coords) {
        mx += x; my += y; mz += z;
      }
      mx /= coords.length;
      my /= coords.length;
      mz /= coords.length;

      const scale = (Math.min(width, height) / 100) * 2.8 * zoom;

      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      const projected = coords.map(([x, y, z], idx) => {
        const dx = x - mx;
        const dy = y - my;
        const dz = z - mz;

        const x1 = dx * cosY - dz * sinY;
        const z1 = dx * sinY + dz * cosY;

        const y2 = dy * cosX - z1 * sinX;
        const z2 = dy * sinX + z1 * cosX;

        const ss = structure.secondary_structure[idx] || 'C';
        const isHighlight = highlightPosition === (idx + 1);

        return {
          px: cx + x1 * scale,
          py: cy + y2 * scale,
          pz: z2,
          idx: idx + 1,
          ss,
          isHighlight
        };
      });

      const sortedEdges: { p1: any; p2: any; z: number }[] = [];
      for (let i = 0; i < projected.length - 1; i++) {
        sortedEdges.push({
          p1: projected[i],
          p2: projected[i + 1],
          z: (projected[i].pz + projected[i + 1].pz) / 2
        });
      }
      sortedEdges.sort((a, b) => a.z - b.z);

      // Draw backbone ribbon
      for (const edge of sortedEdges) {
        const { p1, p2 } = edge;
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);

        // Mandrake Dark Palette: White alpha-helix, subtle grey strand, dark grey coil
        let strokeColor = '#3A3935';
        let lineWidth = 2.0;

        if (p1.ss === 'H' && p2.ss === 'H') {
          strokeColor = '#F8F7F2';
          lineWidth = 3.5;
        } else if (p1.ss === 'E' && p2.ss === 'E') {
          strokeColor = '#8E8C84';
          lineWidth = 3.0;
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // Draw residue nodes
      const sortedNodes = [...projected].sort((a, b) => a.pz - b.pz);
      for (const node of sortedNodes) {
        ctx.beginPath();
        let r = 2.2;
        let color = '#57554F';

        if (node.isHighlight) {
          r = 6.0;
          color = '#D8FF4F';
          // Chartreuse glow
          ctx.arc(node.px, node.py, 10, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(216, 255, 79, 0.25)';
          ctx.fill();
          ctx.beginPath();
        } else if (node.ss === 'H') {
          color = '#F8F7F2';
          r = 2.8;
        } else if (node.ss === 'E') {
          color = '#A8A69E';
          r = 2.8;
        }

        ctx.arc(node.px, node.py, r, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [structure, rotX, rotY, zoom, isAutoRotate, isDragging, highlightPosition]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    setRotY((prev) => prev + dx * 0.01);
    setRotX((prev) => prev - dy * 0.01);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!structure) {
    return (
      <div className="panel-dark" style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading 3D structure coordinates...</p>
      </div>
    );
  }

  return (
    <div className="panel-dark">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '12px' }}>
        <div>
          <span className="hero-label" style={{ color: 'var(--accent)' }}>3D STRUCTURE</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <h3 style={{ fontSize: '1.25rem' }}>Crystallographic Fold</h3>
            <Badge variant="dark">{structure.pdb_id} (Chain {structure.chain})</Badge>
            <Badge variant="dark">{structure.resolution}</Badge>
          </div>
        </div>

        {/* Minimal Controls */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            className="btn-dark"
            title="Toggle Auto Rotation"
          >
            <RotateCw size={12} style={{ color: isAutoRotate ? 'var(--accent)' : 'inherit' }} />
            {isAutoRotate ? 'Auto' : 'Paused'}
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
            className="btn-dark"
            title="Zoom In"
          >
            <ZoomIn size={12} />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
            className="btn-dark"
            title="Zoom Out"
          >
            <ZoomOut size={12} />
          </button>
        </div>
      </div>

      {/* 3D Canvas Box */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '340px',
          background: '#0D0D0C',
          borderRadius: '2px',
          border: '1px solid var(--border-dark)',
          cursor: isDragging ? 'grabbing' : 'grab',
          overflow: 'hidden'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas
          ref={canvasRef}
          width={650}
          height={340}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />

        {/* Minimal Structure Legend Overlay */}
        <div
          className="mono"
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            background: 'rgba(17, 17, 15, 0.9)',
            border: '1px solid var(--border-dark)',
            padding: '6px 12px',
            borderRadius: '2px',
            fontSize: '0.6875rem',
            color: '#A8A69E',
            display: 'flex',
            gap: '16px'
          }}
        >
          <div>
            <span style={{ color: '#F8F7F2' }}>■ Helix</span>
          </div>
          <div>
            <span style={{ color: '#8E8C84' }}>■ Strand</span>
          </div>
          <div>
            <span style={{ color: '#57554F' }}>■ Coil</span>
          </div>
          <div>
            B-FACTOR: <strong style={{ color: '#F8F7F2' }}>{structure.mean_b_factor.toFixed(1)} Å²</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
