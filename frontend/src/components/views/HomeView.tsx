import React from 'react';
import { ArrowRight, Dna, Cpu, Box, Share2, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';

interface HomeViewProps {
  onNavigate: (tab: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  return (
    <div style={{ width: '100%', color: '#11110F' }}>
      {/* 1. EDITORIAL HERO SECTION */}
      <section
        style={{
          padding: '80px 0 64px',
          textAlign: 'center',
          maxWidth: '960px',
          margin: '0 auto'
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            background: '#11110F',
            borderRadius: '4px',
            color: '#D8FF4F',
            fontSize: '0.75rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '24px',
            fontFamily: 'monospace'
          }}
        >
          <Sparkles size={14} /> reppred &bull; ProtBench Benchmark
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
            margin: '0 0 24px 0',
            color: '#11110F'
          }}
        >
          Proteins can be represented <br />
          <span style={{ background: '#D8FF4F', padding: '0 8px', borderRadius: '4px' }}>in more than one way.</span>
        </h1>

        <p
          style={{
            fontSize: '1.25rem',
            fontWeight: 500,
            color: '#5a5852',
            lineHeight: 1.5,
            marginBottom: '16px',
            maxWidth: '800px',
            margin: '0 auto 16px'
          }}
        >
          ProtBench asks which representation provides useful information for predicting mutation-driven protein stability ($\Delta\Delta G$).
        </p>

        <p
          style={{
            fontSize: '0.95rem',
            color: '#7a776e',
            lineHeight: 1.6,
            marginBottom: '36px',
            maxWidth: '740px',
            margin: '0 auto 36px'
          }}
        >
          We compare sequence, learned language representations, experimental 3D structure, contact networks, and graph representations using the exact same FireProt mutations and the same protein-held-out evaluation protocol.
        </p>

        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigate('explore')}
            className="btn-mandrake-primary"
            style={{ padding: '14px 28px', fontSize: '0.95rem' }}
          >
            Explore a Mutation <ArrowRight size={16} />
          </button>
          <button
            onClick={() => onNavigate('benchmark')}
            className="btn-mandrake-secondary"
            style={{ padding: '14px 28px', fontSize: '0.95rem' }}
          >
            View Benchmark Results
          </button>
        </div>
      </section>

      {/* 2. STATS BAR SECTION */}
      <section
        style={{
          background: '#11110F',
          borderTop: '1px solid #2A2925',
          borderBottom: '1px solid #2A2925',
          padding: '40px 32px',
          color: '#F8F7F2'
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px',
            textAlign: 'center'
          }}
        >
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#D8FF4F', fontFamily: 'monospace' }}>3,433</div>
            <div style={{ fontSize: '0.8rem', color: '#a3a199', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Mapped FireProt Mutations
            </div>
          </div>

          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#10b981', fontFamily: 'monospace' }}>100</div>
            <div style={{ fontSize: '0.8rem', color: '#a3a199', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Experimental WT PDB Structures
            </div>
          </div>

          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#6366f1', fontFamily: 'monospace' }}>5</div>
            <div style={{ fontSize: '0.8rem', color: '#a3a199', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Representation Paradigms
            </div>
          </div>

          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8F7F2', marginTop: '6px' }}>
              2,681 <span style={{ fontSize: '0.75rem', color: '#6F6D67' }}>TR</span> &bull; 402 <span style={{ fontSize: '0.75rem', color: '#6F6D67' }}>VAL</span> &bull; 350 <span style={{ fontSize: '0.75rem', color: '#6F6D67' }}>TEST</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#D8FF4F', fontWeight: 800, marginTop: '4px', textTransform: 'uppercase' }}>
              Protein-Held-Out Evaluation
            </div>
          </div>
        </div>
      </section>

      {/* 3. FIVE REPRESENTATION PROGRESSION SYSTEM */}
      <section style={{ padding: '80px 32px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 12px 0' }}>
            The Five Representation Paradigms
          </h2>
          <p style={{ fontSize: '1rem', color: '#5a5852', maxWidth: '640px', margin: '0 auto' }}>
            From simple sequence features to 3D spatial environments and learned graph networks.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
          {/* 1. Sequence */}
          <div className="editorial-card-light">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <Dna size={22} color="#4f46e5" />
              <span className="badge-dark">252D</span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 8px 0', color: '#11110F' }}>Hand-Engineered Sequence</h3>
            <p style={{ fontSize: '0.8rem', color: '#5a5852', lineHeight: 1.5, margin: 0 }}>
              AA one-hot vectors, BLOSUM62 scores, sidechain property deltas, and 10-residue flanking sequence context.
            </p>
          </div>

          {/* 2. ESM-2 */}
          <div className="editorial-card-light">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <Cpu size={22} color="#d97706" />
              <span className="badge-lime">1280D</span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 8px 0', color: '#11110F' }}>ESM-2 8M Learned</h3>
            <p style={{ fontSize: '0.8rem', color: '#5a5852', lineHeight: 1.5, margin: 0 }}>
              Mean-pooled Transformer sequence embeddings capturing high-dimensional learned latent patterns.
            </p>
          </div>

          {/* 3. 3D Structure */}
          <div className="editorial-card-light">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <Box size={22} color="#10b981" />
              <span className="badge-dark">131D</span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 8px 0', color: '#11110F' }}>Experimental WT 3D</h3>
            <p style={{ fontSize: '0.8rem', color: '#5a5852', lineHeight: 1.5, margin: 0 }}>
              Local packing density, 10Å mass density, backbone dihedrals, B-factor, and nearest-neighbor 3D distances.
            </p>
          </div>

          {/* 4. Contact Map */}
          <div className="editorial-card-light">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <Share2 size={22} color="#e11d48" />
              <span className="badge-lime">107D</span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 8px 0', color: '#11110F' }}>Experimental WT Contact Map</h3>
            <p style={{ fontSize: '0.8rem', color: '#5a5852', lineHeight: 1.5, margin: 0 }}>
              Explicit Cα–Cα ≤ 8.0 Å contact network density, sequence separation ranges, and contact physicochemical composition.
            </p>
          </div>

          {/* 5. GNN */}
          <div className="editorial-card-light">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <Sparkles size={22} color="#9333ea" />
              <span className="badge-dark">GNN GRAPH</span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 8px 0', color: '#11110F' }}>Experimental WT Protein Graph</h3>
            <p style={{ fontSize: '0.8rem', color: '#5a5852', lineHeight: 1.5, margin: 0 }}>
              Learned 3-layer EdgeConv GNN message-passing network over physical protein graph nodes and edges.
            </p>
          </div>
        </div>
      </section>

      {/* 4. RESEARCH QUESTION SECTION */}
      <section
        style={{
          background: '#F8F7F3',
          borderTop: '1px solid #D8D5CC',
          padding: '72px 32px'
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 20px 0', color: '#11110F' }}>
            How should a model read a protein?
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#5a5852', lineHeight: 1.7, marginBottom: '32px' }}>
            A sequence is compact, but it hides spatial relationships. A structure exposes physical context, while contact networks expose how residues relate across the protein. Learned representations capture information that may not have an obvious human-readable interpretation.
          </p>

          <div style={{ background: '#11110F', borderRadius: '8px', padding: '24px', textAlign: 'left', display: 'flex', gap: '16px', alignItems: 'flex-start', color: '#F8F7F2' }}>
            <ShieldCheck size={24} color="#D8FF4F" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#D8FF4F', margin: '0 0 6px 0' }}>The Core Research Story</h4>
              <p style={{ fontSize: '0.875rem', color: '#a3a199', lineHeight: 1.6, margin: 0 }}>
                ESM-2 achieved the lowest MAE on the official held-out test set, whereas the Experimental WT Contact Map achieved the strongest cross-protein grouped-CV performance. Experimental WT 3D achieved the highest test R² and Pearson correlation. The Protein GNN remained competitive but did not improve over the simpler Contact Map representation under grouped cross-protein evaluation.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
