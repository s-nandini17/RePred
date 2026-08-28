import React, { useState, useEffect } from 'react';
import { MutationItem, BenchmarkComparisonItem, FeatureImportanceItem } from '../../types/benchmark';
import { PdbStructureViewer3D } from '../structure/PdbStructureViewer3D';
import {
  ArrowRight,
  Sparkles,
  Dna,
  Cpu,
  Box,
  Share2,
  Trophy,
  Award,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Info,
  Layers,
  ArrowDown,
  ChevronRight,
  BarChart3,
  HelpCircle,
  FileText
} from 'lucide-react';

interface ResearchViewProps {
  onNavigate: (tab: string) => void;
  comparisonData: BenchmarkComparisonItem[];
  featureImportanceData: Record<string, FeatureImportanceItem[]>;
}

export const ResearchView: React.FC<ResearchViewProps> = ({
  onNavigate,
  comparisonData,
  featureImportanceData
}) => {
  const [activeRepTab, setActiveRepTab] = useState<'seq' | 'esm' | '3d' | 'cm' | 'gnn'>('3d');
  const [selectedParadigm, setSelectedParadigm] = useState<'seq' | 'esm' | '3d' | 'cm' | 'gnn'>('3d');

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const seqFeatures = featureImportanceData['sequence'] || [];
  const structFeatures = featureImportanceData['3d'] || [];
  const contactFeatures = featureImportanceData['contact_map'] || [];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', color: '#11110F' }}>
      {/* 1. HERO SECTION */}
      <section
        id="section-hero"
        style={{
          padding: '72px 0 64px',
          textAlign: 'center',
          borderBottom: '1px solid #11110F',
          marginBottom: '64px'
        }}
      >
        <div className="badge-arch-lime" style={{ display: 'inline-block', marginBottom: '20px' }}>
          INTERACTIVE SCIENTIFIC RESEARCH JOURNEY &bull; PROTBENCH
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)',
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
            margin: '0 0 24px 0'
          }}
        >
          How should a model read a protein?
        </h1>

        <p
          style={{
            fontSize: '1.25rem',
            fontWeight: 500,
            color: '#52504a',
            lineHeight: 1.5,
            maxWidth: '840px',
            margin: '0 auto 20px'
          }}
        >
          Proteins can be represented in more than one way. ProtBench asks which representation provides useful information for predicting mutation-driven protein stability ($\Delta\Delta G$).
        </p>

        <div
          style={{
            display: 'inline-block',
            background: '#F3EFE6',
            border: '1px solid #11110F',
            borderRadius: '4px',
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: 700,
            marginBottom: '32px'
          }}
        >
          Five representations &bull; One experimental dataset &bull; One controlled benchmark
        </div>

        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => scrollToSection('section-problem')} className="btn-arch-black">
            Begin the Research <ArrowDown size={14} />
          </button>
          <button onClick={() => scrollToSection('section-benchmark-results')} className="btn-arch-white">
            Jump to Benchmark Results
          </button>
        </div>
      </section>

      {/* SECTION 1 — THE ORIGINAL PROBLEM */}
      <section id="section-problem" className="arch-card-white" style={{ marginBottom: '64px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#52504a', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'monospace' }}>
          SECTION 01 &bull; PROBLEM FORMULATION
        </div>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 16px 0' }}>
          A protein is more than a sequence.
        </h2>
        <p style={{ fontSize: '1.05rem', color: '#52504a', lineHeight: 1.6, marginBottom: '24px' }}>
          Protein sequences are compact and easy for machine learning models to process. However, sequence alone does not explicitly describe the complex three-dimensional physical relationships between residues across the folded protein.
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            background: '#F8F6F0',
            border: '1px solid #11110F',
            padding: '20px',
            borderRadius: '4px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ textAlign: 'center', flex: '1 1 120px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4f46e5' }}>SEQUENCE</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '4px' }}>Compact 1D</div>
          </div>
          <ArrowRight size={18} color="#827f76" />
          <div style={{ textAlign: 'center', flex: '1 1 120px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#d97706' }}>ESM-2</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '4px' }}>Learned Latent</div>
          </div>
          <ArrowRight size={18} color="#827f76" />
          <div style={{ textAlign: 'center', flex: '1 1 120px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981' }}>STRUCTURE</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '4px' }}>Local 3D Env</div>
          </div>
          <ArrowRight size={18} color="#827f76" />
          <div style={{ textAlign: 'center', flex: '1 1 120px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#e11d48' }}>CONTACTS</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '4px' }}>Spatial Network</div>
          </div>
          <ArrowRight size={18} color="#827f76" />
          <div style={{ textAlign: 'center', flex: '1 1 120px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9333ea' }}>GRAPH</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '4px' }}>GNN Message Pass</div>
          </div>
        </div>

        <div style={{ marginTop: '20px', fontSize: '0.85rem', color: '#52504a', fontStyle: 'italic', background: '#F3EFE6', padding: '12px 16px', borderRadius: '4px' }}>
          *Note: ProtBench does not claim any single representation is universally superior. The goal of this project is to test them experimentally under controlled evaluation protocols.
        </div>
      </section>

      {/* SECTION 2 — THE RESEARCH QUESTION */}
      <section id="section-target" className="arch-card-dark" style={{ marginBottom: '64px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D8FF4F', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'monospace' }}>
          SECTION 02 &bull; RESEARCH QUESTION
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 16px 0', color: '#FBF9F5' }}>
          Does the way we represent a protein change what a model can learn about mutation-induced stability?
        </h2>
        <p style={{ fontSize: '1rem', color: '#a3a199', lineHeight: 1.6, marginBottom: '24px' }}>
          Our experimental target is $\Delta\Delta G$ (free energy change upon mutation). In simple terms, $\Delta\Delta G$ measures how much a single point mutation stabilizes or destabilizes the protein folded state.
        </p>

        <div style={{ background: '#1c1c1a', border: '1px solid #2A2925', padding: '20px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#a3a199', textTransform: 'uppercase', fontWeight: 700 }}>Target Definition</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#D8FF4F', fontFamily: 'monospace', marginTop: '4px' }}>
              WT Protein + Single Point Mutation &rarr; &Delta;&Delta;G (kcal/mol)
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '6px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
              &Delta;&Delta;G &lt; 0 Stabilizing
            </span>
            <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '6px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
              &Delta;&Delta;G &gt; 0 Destabilizing
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 3 — THE DATA */}
      <section id="section-data" className="arch-card-white" style={{ marginBottom: '64px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#52504a', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'monospace' }}>
          SECTION 03 &bull; BIOLOGICAL DATASET
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 24px 0' }}>
          Real FireProt Experimental Dataset
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#F8F6F0', border: '1px solid #11110F', padding: '20px', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#11110F', fontFamily: 'monospace' }}>3,438</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#52504a', textTransform: 'uppercase', marginTop: '4px' }}>
              Original FireProt Mutations
            </div>
          </div>

          <div style={{ background: '#F8F6F0', border: '1px solid #11110F', padding: '20px', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#10b981', fontFamily: 'monospace' }}>3,433</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#52504a', textTransform: 'uppercase', marginTop: '4px' }}>
              Successfully Mapped
            </div>
          </div>

          <div style={{ background: '#F8F6F0', border: '1px solid #11110F', padding: '20px', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#4f46e5', fontFamily: 'monospace' }}>100</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#52504a', textTransform: 'uppercase', marginTop: '4px' }}>
              Experimental WT PDBs
            </div>
          </div>

          <div style={{ background: '#F8F6F0', border: '1px solid #11110F', padding: '20px', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#d97706', fontFamily: 'monospace' }}>5</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#52504a', textTransform: 'uppercase', marginTop: '4px' }}>
              Representation Paradigms
            </div>
          </div>
        </div>

        <div style={{ background: '#F3EFE6', border: '1px solid #C8C2B4', padding: '14px 18px', borderRadius: '4px', fontSize: '0.85rem', color: '#52504a' }}>
          <strong>Unmapped Boundary Exclusion:</strong> Exactly 5 mutations out of 3,438 were excluded because their sequence positions extended beyond the resolved atom residue coordinates of the experimental WT PDB files.
        </div>
      </section>

      {/* SECTION 4 — OFFICIAL DATA SPLIT */}
      <section id="section-split" className="arch-card-white" style={{ marginBottom: '64px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#52504a', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'monospace' }}>
          SECTION 04 &bull; OFFICIAL EVALUATION PROTOCOL
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 16px 0' }}>
          The proteins in the test set were not present in training.
        </h2>
        <p style={{ fontSize: '1rem', color: '#52504a', lineHeight: 1.6, marginBottom: '24px' }}>
          To prevent data leakage, the official benchmark split strictly isolates proteins by UniProt ID.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#F8F6F0', border: '1px solid #11110F', padding: '20px', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase' }}>TRAIN SET</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#11110F', fontFamily: 'monospace', margin: '4px 0' }}>2,681</div>
            <div style={{ fontSize: '0.8rem', color: '#52504a', fontWeight: 700 }}>57 UniProt Proteins</div>
          </div>

          <div style={{ background: '#F8F6F0', border: '1px solid #11110F', padding: '20px', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase' }}>VALIDATION SET</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#11110F', fontFamily: 'monospace', margin: '4px 0' }}>402</div>
            <div style={{ fontSize: '0.8rem', color: '#52504a', fontWeight: 700 }}>15 UniProt Proteins</div>
          </div>

          <div style={{ background: '#11110F', border: '1px solid #11110F', padding: '20px', borderRadius: '4px', color: '#FBF9F5' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D8FF4F', textTransform: 'uppercase' }}>OFFICIAL TEST SET</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#D8FF4F', fontFamily: 'monospace', margin: '4px 0' }}>350</div>
            <div style={{ fontSize: '0.8rem', color: '#a3a199', fontWeight: 700 }}>28 UniProt Proteins</div>
          </div>
        </div>

        <div style={{ background: '#11110F', color: '#FBF9F5', padding: '16px', borderRadius: '4px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 800 }}>
          Train &cap; Validation = 0 &bull; Train &cap; Test = 0 &bull; Validation &cap; Test = 0
        </div>
      </section>

      {/* SECTION 5 — REPRESENTATION JOURNEY */}
      <section id="section-representations" className="arch-card-white" style={{ marginBottom: '64px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#52504a', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'monospace' }}>
          SECTION 05 &bull; REPRESENTATION PARADIGM JOURNEY
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 24px 0' }}>
          Explore the Five Representations
        </h2>

        {/* Tab Selector */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px' }}>
          <button
            onClick={() => setActiveRepTab('seq')}
            className={activeRepTab === 'seq' ? 'btn-arch-black' : 'btn-arch-white'}
          >
            1. Sequence (252D)
          </button>
          <button
            onClick={() => setActiveRepTab('esm')}
            className={activeRepTab === 'esm' ? 'btn-arch-black' : 'btn-arch-white'}
          >
            2. ESM-2 (1280D)
          </button>
          <button
            onClick={() => setActiveRepTab('3d')}
            className={activeRepTab === '3d' ? 'btn-arch-black' : 'btn-arch-white'}
          >
            3. WT 3D (131D)
          </button>
          <button
            onClick={() => setActiveRepTab('cm')}
            className={activeRepTab === 'cm' ? 'btn-arch-black' : 'btn-arch-white'}
          >
            4. Contact Map (107D)
          </button>
          <button
            onClick={() => setActiveRepTab('gnn')}
            className={activeRepTab === 'gnn' ? 'btn-arch-black' : 'btn-arch-white'}
          >
            5. Protein GNN
          </button>
        </div>

        {/* Active Representation Content */}
        <div style={{ background: '#F8F6F0', border: '1px solid #11110F', padding: '24px', borderRadius: '4px' }}>
          {activeRepTab === 'seq' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>1. Hand-Engineered Sequence Representation</h3>
                <span className="badge-arch-black">252D Vector</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#52504a', lineHeight: 1.5, marginBottom: '16px' }}>
                Converts amino-acid substitution identity, BLOSUM62 score, sidechain property deltas, and 10-residue sequence context into a fixed 252-dimensional feature vector.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span className="badge-arch-lime">delta_hydrophobicity</span>
                <span className="badge-arch-lime">delta_volume_vdw</span>
                <span className="badge-arch-lime">rel_position</span>
                <span className="badge-arch-lime">seq_len</span>
                <span className="badge-arch-lime">wt_hydrophobicity</span>
              </div>
            </div>
          )}

          {activeRepTab === 'esm' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>2. ESM-2 8M Learned Latent Representation</h3>
                <span className="badge-arch-lime">1280D Latent</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#52504a', lineHeight: 1.5, marginBottom: '16px' }}>
                Mean-pooled sequence embeddings extracted directly from the pre-trained `esm2_t6_8M_UR50D` Transformer model.
              </p>
              <div style={{ background: '#11110F', color: '#FBF9F5', padding: '12px 16px', borderRadius: '4px', fontSize: '0.8rem' }}>
                *Note: Individual embedding dimensions are learned high-dimensional features resulting from self-attention and are not assigned fixed human-readable biological labels.
              </div>
            </div>
          )}

          {activeRepTab === '3d' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>3. Experimental WT 3D Representation</h3>
                <span className="badge-arch-black">131D Vector</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#52504a', lineHeight: 1.5, marginBottom: '16px' }}>
                Summarizes the local physical environment around the mutated residue using real experimental wild-type PDB coordinates (10Å mass density, Cα B-factor, backbone dihedrals).
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span className="badge-arch-lime">loc_mol_weight_10A</span>
                <span className="badge-arch-lime">delta_hydrophobicity</span>
                <span className="badge-arch-lime">delta_volume_vdw</span>
                <span className="badge-arch-lime">Calpha_B_factor</span>
                <span className="badge-arch-lime">nearest_neighbor_1_dist_A</span>
              </div>
            </div>
          )}

          {activeRepTab === 'cm' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>4. Experimental WT Contact Map Representation</h3>
                <span className="badge-arch-lime">107D Vector &bull; Cα–Cα &le; 8.0Å</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#52504a', lineHeight: 1.5, marginBottom: '16px' }}>
                Explicitly describes which residues are spatially connected across the protein structure (8Å and 10Å contact counts, contact density, sequence separation, contacted amino-acid composition).
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span className="badge-arch-lime">contact_count_10A</span>
                <span className="badge-arch-lime">local_contact_density_8A</span>
                <span className="badge-arch-lime">mean_seq_separation_8A</span>
                <span className="badge-arch-lime">contact_mean_mol_weight</span>
              </div>
            </div>
          )}

          {activeRepTab === 'gnn' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>5. Experimental WT Protein Graph GNN</h3>
                <span className="badge-arch-black">Graph EdgeConv &bull; 3 Layers</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#52504a', lineHeight: 1.5, marginBottom: '16px' }}>
                Operates directly on the experimental WT protein graph using 3 EdgeConv message-passing layers over 58D node features and 3D edge attributes (Cα–Cα distance $d \le 8.0$ Å).
              </p>
              <div style={{ background: '#11110F', color: '#FBF9F5', padding: '12px 16px', borderRadius: '4px', fontSize: '0.8rem' }}>
                *Note: The graph is constructed from the experimental WT structure plus mutation information attached to the mutation node. Never uses mutant structures.
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 6 — BENCHMARK RESULTS */}
      <section id="section-benchmark-results" className="arch-card-white" style={{ marginBottom: '64px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#52504a', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'monospace' }}>
          SECTION 06 &bull; CONTROLLED BENCHMARK FINDINGS
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 16px 0' }}>
          Official Test vs. Grouped Cross-Protein Generalization
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          {/* Official Test Card */}
          <div style={{ background: '#11110F', color: '#FBF9F5', padding: '24px', borderRadius: '4px', border: '1px solid #11110F' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D8FF4F', textTransform: 'uppercase', marginBottom: '6px' }}>
              OFFICIAL HELD-OUT TEST (N=350)
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FBF9F5', marginBottom: '12px' }}>
              ESM-2 Best Test MAE
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#D8FF4F', fontFamily: 'monospace', marginBottom: '12px' }}>
              1.4335 kcal/mol
            </div>
            <div style={{ fontSize: '0.85rem', color: '#a3a199', lineHeight: 1.5 }}>
              Experimental WT 3D achieved highest Test $R^2 = 0.1178$ and Pearson $r = 0.3534$.
            </div>
          </div>

          {/* Grouped CV Card */}
          <div style={{ background: '#F8F6F0', padding: '24px', borderRadius: '4px', border: '1px solid #11110F' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', marginBottom: '6px' }}>
              GROUPED CROSS-PROTEIN CV (N=3,083)
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#11110F', marginBottom: '12px' }}>
              Contact Map Best CV MAE
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981', fontFamily: 'monospace', marginBottom: '12px' }}>
              1.1234 &plusmn; 0.1080 kcal/mol
            </div>
            <div style={{ fontSize: '0.85rem', color: '#52504a', lineHeight: 1.5 }}>
              Contact Map achieved highest Grouped CV $R^2 = 0.2078$ and Pearson $r = 0.5214$.
            </div>
          </div>
        </div>

        {/* Core Takeaway Banner */}
        <div style={{ background: '#11110F', color: '#FBF9F5', padding: '20px', borderRadius: '4px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <ShieldCheck size={24} color="#D8FF4F" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#D8FF4F', margin: '0 0 6px 0' }}>The Main Scientific Finding</h4>
            <p style={{ fontSize: '0.9rem', color: '#a3a199', lineHeight: 1.5, margin: 0 }}>
              There is no single universal winner. ESM-2 performed best on the official held-out test MAE, while Contact Map performed best under grouped cross-protein evaluation. Under protein-grouped evaluation, explicit structural/contact representations performed particularly strongly.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 7 — CURRENT SCOPE */}
      <section id="section-scope" className="arch-card-white" style={{ marginBottom: '64px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#52504a', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'monospace' }}>
          SECTION 07 &bull; SCIENTIFIC SCOPE &amp; BOUNDARIES
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 24px 0' }}>
          What ProtBench IS vs. What It Is NOT
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div style={{ background: '#F8F6F0', border: '1px solid #10b981', padding: '20px', borderRadius: '4px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#10b981', marginBottom: '12px' }}>What ProtBench IS</h3>
            <ul style={{ fontSize: '0.85rem', color: '#52504a', lineHeight: 1.8, paddingLeft: '18px' }}>
              <li>A controlled 5-representation benchmark for $\Delta\Delta G$ stability</li>
              <li>Derived strictly from 100 experimental wild-type PDBs</li>
              <li>A research exploration tool over 3,433 FireProt mutations</li>
              <li>A benchmark of predictive association, not biological causality</li>
            </ul>
          </div>

          <div style={{ background: '#F8F6F0', border: '1px solid #e11d48', padding: '20px', borderRadius: '4px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#e11d48', marginBottom: '12px' }}>What ProtBench IS NOT</h3>
            <ul style={{ fontSize: '0.85rem', color: '#52504a', lineHeight: 1.8, paddingLeft: '18px' }}>
              <li>Not a mutant structure generator</li>
              <li>Not AlphaFold or ESMFold</li>
              <li>Not a binding affinity predictor</li>
              <li>Not a molecular dynamics simulator</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 8 — RECAP NAVIGATOR */}
      <section style={{ textAlign: 'center', padding: '40px 0' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>What do you want to explore next?</h3>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => onNavigate('explore')} className="btn-arch-black">
            Explore a Mutation
          </button>
          <button onClick={() => onNavigate('benchmark')} className="btn-arch-white">
            View Leaderboard
          </button>
          <button onClick={() => onNavigate('interpretability')} className="btn-arch-white">
            Feature Importance
          </button>
          <button onClick={() => onNavigate('data')} className="btn-arch-white">
            Data Provenance
          </button>
        </div>
      </section>
    </div>
  );
};
