import React, { useState } from 'react';
import { StructureData, RepresentationInfo } from '../../types';
import { Structure3DViewer } from './Structure3DViewer';
import { ContactMapViewer } from './ContactMapViewer';
import { ProteinGraphViewer } from './ProteinGraphViewer';
import { EsmEmbeddingViewer } from './EsmEmbeddingViewer';
import { Badge } from '../common/Badge';

interface RepresentationExplorerProps {
  structure: StructureData | null;
  representations: RepresentationInfo[];
  selectedPosition?: number | null;
  onSelectPosition?: (pos: number) => void;
}

export const RepresentationExplorer: React.FC<RepresentationExplorerProps> = ({
  structure,
  selectedPosition
}) => {
  const [activeRepTab, setActiveRepTab] = useState<string>('structure');

  const repTabs = [
    { id: 'sequence', label: '1. Sequence (75D)', tag: 'Physicochemical' },
    { id: 'structure', label: '2. 3D Structure (22D)', tag: 'Spatial/RSA' },
    { id: 'contact_map', label: '3. Contact Map (17D)', tag: '2D Topology' },
    { id: 'graph', label: '4. Protein Graph (45D)', tag: 'GNN Node/Edge' },
    { id: 'esm', label: '5. Learned ESM (75D)', tag: 'Protein LM' },
    { id: 'hybrid', label: '6. Multi-Modal (189D)', tag: 'Fusion' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Section Header */}
      <div className="section-header">
        <div>
          <span className="hero-label">MODALITY ARCHITECTURE</span>
          <h2 className="section-title">Protein Representation Engines</h2>
          <p className="section-subtitle">
            Compare biophysical vectorizations, topological graph constructions, and latent language embeddings.
          </p>
        </div>
      </div>

      {/* Representation Selector Bar */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          borderBottom: '1px solid var(--border)'
        }}
      >
        {repTabs.map((tab) => {
          const isActive = activeRepTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveRepTab(tab.id)}
              className={isActive ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 16px' }}
            >
              <span>{tab.label}</span>
              <Badge variant={isActive ? 'accent' : 'neutral'}>{tab.tag}</Badge>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Sequence Details */}
      {activeRepTab === 'sequence' && (
        <div className="panel-light">
          <span className="hero-label">REPRESENTATION SPECIFICATION</span>
          <h3 style={{ fontSize: '1.25rem', marginTop: '2px', marginBottom: '8px' }}>Sequence Vectorization (75-Dimensional)</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
            Direct translation of amino acid alphabet into biophysical, evolutionary, and positional numerical tokens.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '2px', border: '1px solid var(--border)' }}>
              <div className="mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>ONE-HOT DELTA</div>
              <div className="mono" style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: '2px' }}>40D (20 WT + 20 Mut)</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '2px', border: '1px solid var(--border)' }}>
              <div className="mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>PHYSICOCHEMICAL</div>
              <div className="mono" style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: '2px' }}>17D (Hydropathy, Charge, Vol)</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '2px', border: '1px solid var(--border)' }}>
              <div className="mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>EVOLUTIONARY MATRIX</div>
              <div className="mono" style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: '2px' }}>BLOSUM62 Delta</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '2px', border: '1px solid var(--border)' }}>
              <div className="mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>POSITIONAL ENCODING</div>
              <div className="mono" style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: '2px' }}>3D (Norm Pos, Terminus)</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: 3D Structure */}
      {activeRepTab === 'structure' && (
        <Structure3DViewer structure={structure} highlightPosition={selectedPosition} />
      )}

      {/* Tab 3: Contact Map */}
      {activeRepTab === 'contact_map' && (
        <ContactMapViewer structure={structure} highlightPosition={selectedPosition} />
      )}

      {/* Tab 4: Protein Graph */}
      {activeRepTab === 'graph' && (
        <ProteinGraphViewer structure={structure} highlightPosition={selectedPosition} />
      )}

      {/* Tab 5: Learned ESM */}
      {activeRepTab === 'esm' && (
        <EsmEmbeddingViewer sequence={structure?.sequence || ''} highlightPosition={selectedPosition} />
      )}

      {/* Tab 6: Multi-Modal Hybrid */}
      {activeRepTab === 'hybrid' && (
        <div className="panel-light">
          <span className="hero-label">FUSION ARCHITECTURE</span>
          <h3 style={{ fontSize: '1.25rem', marginTop: '2px', marginBottom: '8px' }}>All-Modality Multi-Modal Concatenation (189D)</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
            Concatenates Sequence (75D) + Structure (22D) + Contact (17D) + ESM-2 (75D) into a unified multi-modal feature vector.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '2px', border: '1px solid var(--border)' }}>
              <div className="mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>TOTAL FEATURE DIM</div>
              <div className="mono" style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: '2px' }}>189 Dimensions</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '2px', border: '1px solid var(--border)' }}>
              <div className="mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>STRUCTURAL RSA</div>
              <div className="mono" style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: '2px' }}>Solvent Accessibility</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '2px', border: '1px solid var(--border)' }}>
              <div className="mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>LANGUAGE ATTENTION</div>
              <div className="mono" style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: '2px' }}>ESM-2 Latent Perturbation</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
