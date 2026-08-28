import React, { useEffect, useRef, useState } from 'react';
import { RotateCw, ZoomIn, ZoomOut, Eye, Info, Sparkles, Layers } from 'lucide-react';

interface PdbStructureViewer3DProps {
  pdbId: string;
  chain: string;
  pdbPosition: number;
  wtAa: string;
  mutAa: string;
  onSelectResidue?: (resNum: number) => void;
}

interface AtomRecord {
  atomName: string;
  resName: string;
  chain: string;
  resNum: number;
  x: number;
  y: number;
  z: number;
  bFactor: number;
}

export const PdbStructureViewer3D: React.FC<PdbStructureViewer3DProps> = ({
  pdbId,
  chain,
  pdbPosition,
  wtAa,
  mutAa,
  onSelectResidue
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [atoms, setAtoms] = useState<AtomRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [showContacts, setShowContacts] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  
  // Rotation state
  const rotXRef = useRef<number>(0.3);
  const rotYRef = useRef<number>(0.5);
  const isDraggingRef = useRef<boolean>(false);
  const lastMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 1. Fetch & Parse PDB File
  useEffect(() => {
    if (!pdbId) return;
    setLoading(true);
    setError(null);

    const pdbUrl = `/pdbs/${pdbId.toUpperCase()}.pdb`;
    fetch(pdbUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`PDB file ${pdbId}.pdb not available in current prototype`);
        }
        return res.text();
      })
      .then((text) => {
        const lines = text.split('\n');
        const parsed: AtomRecord[] = [];

        for (const line of lines) {
          if (line.startsWith('ATOM  ') || line.startsWith('HETATM')) {
            const atomName = line.substring(12, 16).trim();
            if (atomName === 'CA') { // C-alpha trace
              const resName = line.substring(17, 20).trim();
              const ch = line.substring(21, 22).trim();
              const resNum = parseInt(line.substring(22, 26).trim(), 10);
              const x = parseFloat(line.substring(30, 38).trim());
              const y = parseFloat(line.substring(38, 46).trim());
              const z = parseFloat(line.substring(46, 54).trim());
              const bFactor = parseFloat(line.substring(60, 66).trim()) || 0.0;

              if (!isNaN(x) && !isNaN(y) && !isNaN(z) && !isNaN(resNum)) {
                parsed.push({ atomName, resName, chain: ch, resNum, x, y, z, bFactor });
              }
            }
          }
        }

        if (parsed.length === 0) {
          setError(`No Cα atoms found in ${pdbId}.pdb`);
        } else {
          setAtoms(parsed);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [pdbId]);

  // 2. Render 3D Canvas Ribbon & Mutation Site Marker
  useEffect(() => {
    if (!canvasRef.current || atoms.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    // Calculate center of mass
    let sumX = 0, sumY = 0, sumZ = 0;
    for (const a of atoms) {
      sumX += a.x;
      sumY += a.y;
      sumZ += a.z;
    }
    const comX = sumX / atoms.length;
    const comY = sumY / atoms.length;
    const comZ = sumZ / atoms.length;

    // Scale factor
    let maxDist = 0;
    for (const a of atoms) {
      const d = Math.sqrt((a.x - comX)**2 + (a.y - comY)**2 + (a.z - comZ)**2);
      if (d > maxDist) maxDist = d;
    }
    const baseScale = (Math.min(canvas.width, canvas.height) * 0.38) / (maxDist || 1.0);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (autoRotate && !isDraggingRef.current) {
        rotYRef.current += 0.006;
      }

      const rx = rotXRef.current;
      const ry = rotYRef.current;

      const cosX = Math.cos(rx), sinX = Math.sin(rx);
      const cosY = Math.cos(ry), sinY = Math.sin(ry);

      // Project 3D points
      const projected = atoms.map((a) => {
        const dx = a.x - comX;
        const dy = a.y - comY;
        const dz = a.z - comZ;

        // Rotate Y
        const x1 = dx * cosY + dz * sinY;
        const y1 = dy;
        const z1 = -dx * sinY + dz * cosY;

        // Rotate X
        const x2 = x1;
        const y2 = y1 * cosX - z1 * sinX;
        const z2 = y1 * sinX + z1 * cosX;

        const scale = baseScale * zoomLevel;
        const px = canvas.width / 2 + x2 * scale;
        const py = canvas.height / 2 - y2 * scale;

        const isMutSite = (a.chain === chain || !chain || atoms.length < 50) && a.resNum === pdbPosition;

        return { ...a, px, py, pz: z2, isMutSite };
      });

      // Sort by depth (z-buffer back to front)
      projected.sort((a, b) => a.pz - b.pz);

      // Draw Contacts (d <= 8.0 Å)
      if (showContacts) {
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = 'rgba(216, 255, 79, 0.15)';
        for (let i = 0; i < projected.length; i++) {
          for (let j = i + 1; j < projected.length; j++) {
            const p1 = projected[i];
            const p2 = projected[j];
            const distSq = (p1.x - p2.x)**2 + (p1.y - p2.y)**2 + (p1.z - p2.z)**2;
            if (distSq <= 64.0) { // 8.0 Å
              ctx.beginPath();
              ctx.moveTo(p1.px, p1.py);
              ctx.lineTo(p2.px, p2.py);
              ctx.stroke();
            }
          }
        }
      }

      // Draw Cα Ribbon / Trace
      ctx.lineWidth = 3.0;
      ctx.strokeStyle = '#5a5852';
      ctx.beginPath();
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        if (i === 0) ctx.moveTo(p.px, p.py);
        else ctx.lineTo(p.px, p.py);
      }
      ctx.stroke();

      // Draw Residue Nodes
      for (const p of projected) {
        if (p.isMutSite) {
          // Glow effect for mutation site
          ctx.beginPath();
          ctx.arc(p.px, p.py, 16, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(216, 255, 79, 0.3)';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(p.px, p.py, 9, 0, 2 * Math.PI);
          ctx.fillStyle = '#D8FF4F';
          ctx.strokeStyle = '#11110F';
          ctx.lineWidth = 2;
          ctx.fill();
          ctx.stroke();

          // Mutation Callout Label
          ctx.font = 'bold 12px monospace';
          ctx.fillStyle = '#D8FF4F';
          ctx.fillText(`MUTATION SITE: ${wtAa}${pdbPosition}${mutAa}`, p.px + 14, p.py - 10);

          ctx.font = '10px monospace';
          ctx.fillStyle = '#a3a199';
          ctx.fillText(`Residue #${pdbPosition} (${p.resName})`, p.px + 14, p.py + 4);
        } else {
          ctx.beginPath();
          ctx.arc(p.px, p.py, 3.5, 0, 2 * Math.PI);
          ctx.fillStyle = p.pz > 0 ? '#10b981' : '#2A2925';
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [atoms, autoRotate, showContacts, zoomLevel, chain, pdbPosition, wtAa, mutAa]);

  // Mouse Interaction handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;

    rotYRef.current += dx * 0.008;
    rotXRef.current += dy * 0.008;

    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div style={{ position: 'relative', width: '100%', background: '#11110F', borderRadius: '8px', border: '1px solid #2A2925', overflow: 'hidden', minHeight: '440px' }}>
      {/* Top Banner Labels */}
      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, pointerEvents: 'none' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ padding: '4px 10px', background: '#D8FF4F', color: '#11110F', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em', fontFamily: 'monospace' }}>
            EXPERIMENTAL WT STRUCTURE
          </span>
          <span style={{ padding: '4px 10px', background: '#2A2925', borderRadius: '4px', color: '#F8F7F2', fontSize: '0.75rem', fontWeight: 600 }}>
            PDB: {pdbId.toUpperCase()} (Chain {chain || 'A'})
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px', pointerEvents: 'auto' }}>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title="Toggle Auto Rotation"
            style={{ padding: '6px 10px', background: autoRotate ? '#2A2925' : 'transparent', border: '1px solid #2A2925', borderRadius: '4px', color: '#F8F7F2', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <RotateCw size={12} className={autoRotate ? 'spin' : ''} /> {autoRotate ? 'Rotating' : 'Paused'}
          </button>
          <button
            onClick={() => setShowContacts(!showContacts)}
            title="Toggle 8Å Contact Edges"
            style={{ padding: '6px 10px', background: showContacts ? '#2A2925' : 'transparent', border: '1px solid #2A2925', borderRadius: '4px', color: '#F8F7F2', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Layers size={12} /> {showContacts ? '8Å Edges On' : 'Edges Off'}
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2.5))}
            style={{ padding: '6px', background: '#2A2925', border: '1px solid #2A2925', borderRadius: '4px', color: '#F8F7F2', cursor: 'pointer' }}
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.5))}
            style={{ padding: '6px', background: '#2A2925', border: '1px solid #2A2925', borderRadius: '4px', color: '#F8F7F2', cursor: 'pointer' }}
          >
            <ZoomOut size={14} />
          </button>
        </div>
      </div>

      {/* Loading & Error Overlays */}
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(17, 17, 15, 0.95)', zIndex: 20 }}>
          <RotateCw size={24} color="#D8FF4F" style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
          <div style={{ color: '#F8F7F2', fontSize: '0.875rem' }}>Loading Experimental WT PDB: {pdbId.toUpperCase()}...</div>
        </div>
      )}

      {error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(17, 17, 15, 0.95)', padding: '24px', textAlign: 'center', zIndex: 20 }}>
          <Info size={28} color="#e11d48" style={{ marginBottom: '12px' }} />
          <div style={{ color: '#e11d48', fontWeight: 700, fontSize: '0.95rem', marginBottom: '6px' }}>Structure Unavailable</div>
          <div style={{ color: '#a3a199', fontSize: '0.85rem', maxWidth: '360px', textAlign: 'center' }}>{error}</div>
        </div>
      )}

      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        width={720}
        height={440}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ width: '100%', height: '440px', cursor: isDraggingRef.current ? 'grabbing' : 'grab', display: 'block' }}
      />

      {/* Bottom Information Footer */}
      <div style={{ position: 'absolute', bottom: 12, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none', fontSize: '0.75rem', color: '#a3a199' }}>
        <div>
          <span style={{ color: '#D8FF4F', fontWeight: 800 }}>● MUTATION SITE:</span> {wtAa}{pdbPosition}{mutAa} (Highlighted in chartreuse)
        </div>
        <div style={{ fontStyle: 'italic', color: '#7a776e' }}>
          *Displays experimental wild-type PDB coordinates. Never displays mutant structures.
        </div>
      </div>
    </div>
  );
};
