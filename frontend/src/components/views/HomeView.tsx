import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowDown,
  Dna,
  Cpu,
  Box,
  Share2,
  Sparkles,
  Zap,
  CheckCircle2,
  TrendingDown,
  Layers,
  Database,
  Compass,
  Clock,
  ChevronRight,
  Activity,
  Target
} from 'lucide-react';

interface HomeViewProps {
  onNavigate: (tab: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const [selectedRepTab, setSelectedRepTab] = useState<'seq' | 'esm' | '3d' | 'cm' | 'graph'>('3d');

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', color: '#11110F', padding: '16px 0 64px' }}>
      {/* ============================================================ */}
      {/* SECTION 1 — INTRODUCTION */}
      {/* ============================================================ */}
      <section
        style={{
          padding: '64px 0 72px',
          textAlign: 'center',
          borderBottom: '1px solid #11110F',
          marginBottom: '64px'
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
            marginBottom: '28px',
            fontFamily: 'monospace'
          }}
        >
          <Sparkles size={14} /> RepPred
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.8rem, 6vw, 4.8rem)',
            fontWeight: 900,
            lineHeight: 1.02,
            letterSpacing: '-0.04em',
            margin: '0 0 20px 0',
            color: '#11110F'
          }}
        >
          RepPred
        </h1>

        <div
          style={{
            fontSize: '1.35rem',
            fontWeight: 700,
            color: '#11110F',
            marginBottom: '24px',
            letterSpacing: '-0.02em'
          }}
        >
          Protein representation-benchmark model
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '40px'
          }}
        >
          <span
            style={{
              padding: '6px 14px',
              background: '#F3EFE6',
              border: '1px solid #11110F',
              borderRadius: '4px',
              fontSize: '0.85rem',
              fontWeight: 700,
              fontFamily: 'monospace'
            }}
          >
            Protein Design Task
          </span>
          <span
            style={{
              padding: '6px 14px',
              background: '#F3EFE6',
              border: '1px solid #11110F',
              borderRadius: '4px',
              fontSize: '0.85rem',
              fontWeight: 700,
              fontFamily: 'monospace'
            }}
          >
            5 protein representations
          </span>
        </div>

        {/* Transition Card */}
        <div
          style={{
            background: '#11110F',
            color: '#FBF9F5',
            padding: '24px 32px',
            borderRadius: '6px',
            maxWidth: '640px',
            margin: '0 auto 28px',
            border: '1px solid #11110F',
            boxShadow: '3px 3px 0px #11110F'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#a3a199', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.06em' }}>
            CORE PARADIGM SHIFT
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#a3a199' }}>FROM “TRY EVERYTHING”</span>
            <ArrowRight size={20} color="#D8FF4F" />
            <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#D8FF4F' }}>“USE WHAT MATTERS”</span>
          </div>
        </div>

      </section>

      {/* ============================================================ */}
      {/* SECTION 2 — THE PROBLEM */}
      {/* ============================================================ */}
      <section
        style={{
          background: '#ffffff',
          border: '1px solid #11110F',
          borderRadius: '6px',
          padding: '40px 36px',
          marginBottom: '64px',
          boxShadow: '2px 2px 0px #11110F'
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#52504a', textTransform: 'uppercase', marginBottom: '12px', fontFamily: 'monospace' }}>
          SECTION 2 &bull; THE PROBLEM
        </div>


        {/* Sub-block 1: Protein Engineering Problem */}
        <div
          style={{
            background: '#F8F6F0',
            border: '1px solid #11110F',
            padding: '20px 24px',
            borderRadius: '4px',
            marginBottom: '24px'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#e11d48', textTransform: 'uppercase', marginBottom: '4px' }}>
            Protein Engineering Problem
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#11110F' }}>
            “Single protein-design task requires multiple protein representations.”
          </div>
        </div>

        {/* Sub-block 2: Bottleneck */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#52504a', marginBottom: '12px' }}>
            “Where is the bottleneck?”
          </div>
          <div
            style={{
              background: '#11110F',
              color: '#FBF9F5',
              padding: '20px 24px',
              borderRadius: '4px'
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#D8FF4F', textTransform: 'uppercase', marginBottom: '10px' }}>
              Computational Bottleneck:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div style={{ background: '#1c1b18', padding: '10px 14px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 700 }}>
                &bull; Representation generation
              </div>
              <div style={{ background: '#1c1b18', padding: '10px 14px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 700 }}>
                &bull; Protein-language model embeddings
              </div>
              <div style={{ background: '#1c1b18', padding: '10px 14px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 700 }}>
                &bull; 3D structure generation
              </div>
            </div>
          </div>
        </div>

        {/* Sub-block 3: Requirement */}
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#52504a', marginBottom: '12px' }}>
            “What do we need instead?”
          </div>
          <div
            style={{
              background: '#F3EFE6',
              border: '1px solid #11110F',
              padding: '18px 24px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#11110F', background: '#D8FF4F', padding: '2px 8px', borderRadius: '3px', fontFamily: 'monospace', textTransform: 'uppercase' }}>
              Requirement
            </span>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#11110F' }}>
              “Data-backed representation-benchmarking &rarr; task-specific”
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 3 — THE REPPRED SOLUTION */}
      {/* ============================================================ */}
      <section
        style={{
          background: '#ffffff',
          border: '1px solid #11110F',
          borderRadius: '6px',
          padding: '40px 36px',
          marginBottom: '64px',
          boxShadow: '2px 2px 0px #11110F'
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#52504a', textTransform: 'uppercase', marginBottom: '12px', fontFamily: 'monospace' }}>
          SECTION 3 &bull; THE REPPRED SOLUTION
        </div>

        <div
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            lineHeight: 1.3,
            color: '#11110F',
            marginBottom: '24px'
          }}
        >
          “So, what if we benchmark the representations first?”
        </div>

        {/* 5 Representations Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '10px',
            marginBottom: '24px'
          }}
        >
          <div style={{ background: '#F8F6F0', border: '1px solid #11110F', padding: '14px', borderRadius: '4px', textAlign: 'center' }}>
            <Dna size={18} color="#4f46e5" style={{ marginBottom: '4px' }} />
            <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>Sequence</div>
          </div>
          <div style={{ background: '#F8F6F0', border: '1px solid #11110F', padding: '14px', borderRadius: '4px', textAlign: 'center' }}>
            <Cpu size={18} color="#d97706" style={{ marginBottom: '4px' }} />
            <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>ESM</div>
          </div>
          <div style={{ background: '#F8F6F0', border: '1px solid #11110F', padding: '14px', borderRadius: '4px', textAlign: 'center' }}>
            <Box size={18} color="#10b981" style={{ marginBottom: '4px' }} />
            <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>3D Structure</div>
          </div>
          <div style={{ background: '#F8F6F0', border: '1px solid #11110F', padding: '14px', borderRadius: '4px', textAlign: 'center' }}>
            <Share2 size={18} color="#e11d48" style={{ marginBottom: '4px' }} />
            <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>Contact Map</div>
          </div>
          <div style={{ background: '#F8F6F0', border: '1px solid #11110F', padding: '14px', borderRadius: '4px', textAlign: 'center' }}>
            <Sparkles size={18} color="#9333ea" style={{ marginBottom: '4px' }} />
            <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>Graph</div>
          </div>
        </div>

        {/* Flow: Representation -> Correlation -> Error -> Score */}
        <div
          style={{
            background: '#F8F6F0',
            border: '1px solid #11110F',
            padding: '16px 20px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '24px',
            textAlign: 'center'
          }}
        >
          <div style={{ flex: '1 1 100px', fontWeight: 800, fontSize: '0.9rem' }}>Representation</div>
          <ArrowRight size={16} color="#827f76" />
          <div style={{ flex: '1 1 100px', fontWeight: 800, fontSize: '0.9rem' }}>Correlation</div>
          <ArrowRight size={16} color="#827f76" />
          <div style={{ flex: '1 1 100px', fontWeight: 800, fontSize: '0.9rem' }}>Error</div>
          <ArrowRight size={16} color="#827f76" />
          <div style={{ flex: '1 1 100px', fontWeight: 900, fontSize: '0.95rem', color: '#10b981' }}>Score</div>
        </div>

        {/* Core statement */}
        <div
          style={{
            background: '#11110F',
            color: '#FBF9F5',
            padding: '20px 24px',
            borderRadius: '4px',
            marginBottom: '20px'
          }}
        >
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#D8FF4F', marginBottom: '8px' }}>
            “RepPred evaluates protein representation choices for a specific design task.”
          </div>
          <div style={{ fontSize: '0.9rem', color: '#a3a199' }}>
            <strong>Prototype task:</strong> “Predict mutation-level effects on the protein stability factor (&Delta;&Delta;G).”
          </div>
        </div>

        {/* User Input & Action */}
        <div
          style={{
            background: '#F3EFE6',
            border: '1px solid #11110F',
            padding: '20px 24px',
            borderRadius: '4px',
            marginBottom: '20px'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#52504a', textTransform: 'uppercase', marginBottom: '10px' }}>
            User Input
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#6F6D67' }}>Protein:</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>[Protein ID]</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#6F6D67' }}>Mutation:</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>[e.g., A123V]</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#6F6D67' }}>Task:</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>Stability factor prediction</div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('explore')}
            className="btn-arch-black"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.9rem' }}
          >
            RUN BENCHMARKING MODEL <ArrowRight size={16} />
          </button>
        </div>

        {/* Important PDF statement */}
        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#11110F', marginBottom: '6px' }}>
          “The user doesn't need to select representations manually.”
        </div>
        <div style={{ fontSize: '0.85rem', color: '#52504a' }}>
          “Optimise representations and evaluate features for stability factor prediction.”
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 4 — HOW IT WORKS */}
      {/* ============================================================ */}
      <section
        style={{
          background: '#ffffff',
          border: '1px solid #11110F',
          borderRadius: '6px',
          padding: '40px 36px',
          marginBottom: '64px',
          boxShadow: '2px 2px 0px #11110F'
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#52504a', textTransform: 'uppercase', marginBottom: '12px', fontFamily: 'monospace' }}>
          SECTION 4 &bull; HOW IT WORKS
        </div>

        <div
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            lineHeight: 1.3,
            color: '#11110F',
            marginBottom: '24px'
          }}
        >
          “Where does the benchmark get its evidence?”
        </div>

        {/* FireProt Data Source Block */}
        <div
          style={{
            background: '#F8F6F0',
            border: '1px solid #11110F',
            padding: '24px',
            borderRadius: '4px',
            marginBottom: '24px'
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#11110F', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
            FIREPROT
          </div>
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#10b981', fontFamily: 'monospace' }}>100</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#52504a', textTransform: 'uppercase' }}>WT proteins</div>
            </div>
            <div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#11110F', fontFamily: 'monospace' }}>3,438</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#52504a', textTransform: 'uppercase' }}>mutations</div>
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#52504a', borderTop: '1px solid #D8D5CC', paddingTop: '12px' }}>
            Data validation &amp; mutation information
          </div>
        </div>

        {/* Representation Engine Banner */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#52504a', textTransform: 'uppercase', marginBottom: '8px' }}>
            Representation Engine
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ padding: '8px 14px', background: '#11110F', color: '#D8FF4F', borderRadius: '3px', fontWeight: 800, fontSize: '0.8rem', fontFamily: 'monospace' }}>SEQUENCE</span>
            <span style={{ padding: '8px 14px', background: '#11110F', color: '#D8FF4F', borderRadius: '3px', fontWeight: 800, fontSize: '0.8rem', fontFamily: 'monospace' }}>ESM</span>
            <span style={{ padding: '8px 14px', background: '#11110F', color: '#D8FF4F', borderRadius: '3px', fontWeight: 800, fontSize: '0.8rem', fontFamily: 'monospace' }}>3D</span>
            <span style={{ padding: '8px 14px', background: '#11110F', color: '#D8FF4F', borderRadius: '3px', fontWeight: 800, fontSize: '0.8rem', fontFamily: 'monospace' }}>CONTACT MAP</span>
            <span style={{ padding: '8px 14px', background: '#11110F', color: '#D8FF4F', borderRadius: '3px', fontWeight: 800, fontSize: '0.8rem', fontFamily: 'monospace' }}>GRAPH</span>
          </div>
        </div>

        {/* Step-by-Step Prediction & Benchmark Workflow */}
        <div
          style={{
            background: '#11110F',
            color: '#FBF9F5',
            padding: '24px',
            borderRadius: '4px'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D8FF4F', textTransform: 'uppercase', marginBottom: '16px' }}>
            Benchmarking Workflow
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#2A2925', color: '#D8FF4F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>1</span>
              <span>Prediction Models</span>
            </div>
            <div style={{ paddingLeft: '32px', color: '#a3a199' }}>&darr;</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#2A2925', color: '#D8FF4F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>2</span>
              <span>Predicted &Delta;&Delta;G</span>
            </div>
            <div style={{ paddingLeft: '32px', color: '#a3a199' }}>&darr;</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#2A2925', color: '#D8FF4F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>3</span>
              <span>Compare with experimental &Delta;&Delta;G from FireProt</span>
            </div>
            <div style={{ paddingLeft: '32px', color: '#a3a199' }}>&darr;</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#2A2925', color: '#D8FF4F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>4</span>
              <span>Evaluation Score</span>
            </div>
            <div style={{ paddingLeft: '32px', color: '#a3a199' }}>&darr;</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#D8FF4F', color: '#11110F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900 }}>5</span>
              <span style={{ fontWeight: 800, color: '#D8FF4F' }}>Representation Ranking</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 5 — GLOBAL VISION */}
      {/* ============================================================ */}
      <section
        style={{
          background: '#ffffff',
          border: '1px solid #11110F',
          borderRadius: '6px',
          padding: '40px 36px',
          marginBottom: '64px',
          boxShadow: '2px 2px 0px #11110F'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#52504a', textTransform: 'uppercase', fontFamily: 'monospace' }}>
            SECTION 5 &bull; GLOBAL VISION
          </div>
          <span style={{ padding: '2px 8px', background: '#11110F', color: '#D8FF4F', fontSize: '0.7rem', fontWeight: 800, borderRadius: '3px', fontFamily: 'monospace', textTransform: 'uppercase' }}>
            Global Vision Only
          </span>
        </div>

        <div
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            lineHeight: 1.3,
            color: '#11110F',
            marginBottom: '24px'
          }}
        >
          “And what happens beyond this prototype?”
        </div>

        {/* Global Vision Pipeline */}
        <div
          style={{
            background: '#F8F6F0',
            border: '1px solid #11110F',
            padding: '24px',
            borderRadius: '4px',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.95rem', fontWeight: 800 }}>
            <div>Protein + Design Task</div>
            <div style={{ color: '#827f76' }}>&darr;</div>
            <div>Multiple representations</div>
            <div style={{ color: '#827f76' }}>&darr;</div>
            <div>Task-aware representation optimization</div>
            <div style={{ color: '#827f76' }}>&darr;</div>
            <div style={{ color: '#10b981', fontSize: '1.05rem' }}>Best representation for ANY protein-design task</div>
          </div>
        </div>

        {/* Target Dimensions */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '16px'
          }}
        >
          <div style={{ background: '#F3EFE6', border: '1px solid #11110F', padding: '16px', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>Validated Prototype</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, marginTop: '4px' }}>Stability</div>
          </div>
          <div style={{ background: '#ffffff', border: '1px dashed #C8C2B4', padding: '16px', borderRadius: '4px', textAlign: 'center', opacity: 0.85 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#827f76', textTransform: 'uppercase' }}>Future Target</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#52504a', marginTop: '4px' }}>Binding</div>
          </div>
          <div style={{ background: '#ffffff', border: '1px dashed #C8C2B4', padding: '16px', borderRadius: '4px', textAlign: 'center', opacity: 0.85 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#827f76', textTransform: 'uppercase' }}>Future Target</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#52504a', marginTop: '4px' }}>Function</div>
          </div>
          <div style={{ background: '#ffffff', border: '1px dashed #C8C2B4', padding: '16px', borderRadius: '4px', textAlign: 'center', opacity: 0.85 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#827f76', textTransform: 'uppercase' }}>Future Target</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#52504a', marginTop: '4px' }}>Expression</div>
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#6F6D67', fontStyle: 'italic' }}>
          *Note: Binding, Function, and Expression represent the global vision roadmap, not current prototype capabilities.
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 6 — CURRENT SCOPE */}
      {/* ============================================================ */}
      <section
        style={{
          background: '#ffffff',
          border: '1px solid #11110F',
          borderRadius: '6px',
          padding: '40px 36px',
          marginBottom: '64px',
          boxShadow: '2px 2px 0px #11110F'
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#52504a', textTransform: 'uppercase', marginBottom: '12px', fontFamily: 'monospace' }}>
          SECTION 6 &bull; CURRENT SCOPE
        </div>

        <div
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            lineHeight: 1.3,
            color: '#11110F',
            marginBottom: '24px'
          }}
        >
          “What are we demonstrating today?”
        </div>

        {/* ML / Protein-Design Research */}
        <div
          style={{
            background: '#F8F6F0',
            border: '1px solid #11110F',
            padding: '20px 24px',
            borderRadius: '4px',
            marginBottom: '20px'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', marginBottom: '6px' }}>
            ML / Protein-Design Research
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#11110F' }}>
            “Benchmark representations for the specific protein design task of stability prediction.”
          </div>
        </div>

        {/* Current Limitation & Extended Applications */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div style={{ background: '#F3EFE6', border: '1px solid #11110F', padding: '18px 20px', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#e11d48', textTransform: 'uppercase', marginBottom: '6px' }}>
              Current limitation:
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#11110F' }}>
              “Our current prototype evaluates only one task and one task-prediction factor.”
            </div>
          </div>

          <div style={{ background: '#F8F6F0', border: '1px solid #11110F', padding: '18px 20px', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', marginBottom: '6px' }}>
              Extended applications:
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#11110F' }}>
              &bull; Therapeutic Antibody Engineering<br />
              &bull; Enzyme engineering
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#52504a', fontFamily: 'monospace' }}>
          Scope of RepPred
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 7 — TARGETED IMPACT */}
      {/* ============================================================ */}
      <section
        style={{
          background: '#ffffff',
          border: '1px solid #11110F',
          borderRadius: '6px',
          padding: '40px 36px',
          marginBottom: '48px',
          boxShadow: '2px 2px 0px #11110F'
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#52504a', textTransform: 'uppercase', marginBottom: '12px', fontFamily: 'monospace' }}>
          SECTION 7 &bull; TARGETED IMPACT
        </div>

        <div
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            lineHeight: 1.3,
            color: '#11110F',
            marginBottom: '28px'
          }}
        >
          “If we benchmark first, what can we gain?”
        </div>

        {/* 3 Impact Points */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {/* 1. LOWER COMPUTATIONAL COST */}
          <div style={{ background: '#11110F', color: '#FBF9F5', padding: '22px', borderRadius: '4px', border: '1px solid #11110F' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D8FF4F', textTransform: 'uppercase', marginBottom: '8px' }}>
              1. LOWER COMPUTATIONAL COST
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#D8FF4F', fontFamily: 'monospace', marginBottom: '8px' }}>
              30–40%
            </div>
            <div style={{ fontSize: '0.85rem', color: '#a3a199' }}>
              Target: 30–40% less representation-generation compute.
            </div>
          </div>

          {/* 2. BETTER PREDICTIONS */}
          <div style={{ background: '#F8F6F0', border: '1px solid #11110F', padding: '22px', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', marginBottom: '8px' }}>
              2. BETTER PREDICTIONS
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#11110F', marginTop: '12px', lineHeight: 1.4 }}>
              Less irrelevant information<br />
              <span style={{ color: '#10b981' }}>&rarr; potentially better generalization.</span>
            </div>
          </div>

          {/* 3. FASTER MODEL DEVELOPMENT */}
          <div style={{ background: '#F8F6F0', border: '1px solid #11110F', padding: '22px', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', marginBottom: '8px' }}>
              3. FASTER MODEL DEVELOPMENT
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#11110F', marginTop: '12px', lineHeight: 1.5 }}>
              Benchmark first<br />
              &rarr; select representation<br />
              &rarr; build the model
            </div>
          </div>
        </div>

        {/* Authors Footer */}
        <div style={{ textAlign: 'center', borderTop: '1px solid #11110F', paddingTop: '24px' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#11110F', fontFamily: 'monospace' }}>
            Sachin Nagenahalli, Nandini Solanki and Asma Saifudeen
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeView;
