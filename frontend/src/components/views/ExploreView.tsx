import React, { useState, useEffect } from 'react';
import { MutationItem, FeatureImportanceItem } from '../../types/benchmark';
import { PdbStructureViewer3D } from '../structure/PdbStructureViewer3D';
import { SequencePanel, ESMPanel, StructurePanel, ContactMapPanel, GNNPanel } from '../representations/RepresentationPanels';
import { Dna, Cpu, Box, Share2, Sparkles, Info, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface ExploreViewProps {
  mutations: MutationItem[];
  predictionsMap: Record<string, Record<string, number>>;
  features3dMap: Record<string, any>;
  featuresCmMap: Record<string, any>;
  featureImportanceData: Record<string, FeatureImportanceItem[]>;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  mutations,
  predictionsMap,
  features3dMap,
  featuresCmMap,
  featureImportanceData
}) => {
  const [selectedProteinId, setSelectedProteinId] = useState<string>('');
  const [selectedExpId, setSelectedExpId] = useState<string>('');
  const [activeRepTab, setActiveRepTab] = useState<'sequence' | 'esm' | '3d' | 'contact_map' | 'gnn'>('3d');

  // Unique protein options
  const proteinOptions = React.useMemo(() => {
    const map = new Map<string, { uniprotId: string; pdbId: string; count: number }>();
    for (const m of mutations) {
      const key = `${m.uniprot_id}_${m.pdb_id}`;
      if (!map.has(key)) {
        map.set(key, { uniprotId: m.uniprot_id, pdbId: m.pdb_id, count: 1 });
      } else {
        map.get(key)!.count += 1;
      }
    }
    return Array.from(map.entries()).map(([key, val]) => ({ key, ...val }));
  }, [mutations]);

  // Set default protein & mutation on mount
  useEffect(() => {
    if (proteinOptions.length > 0 && !selectedProteinId) {
      setSelectedProteinId(proteinOptions[0].key);
    }
  }, [proteinOptions, selectedProteinId]);

  // Filter mutations for selected protein
  const availableMutations = React.useMemo(() => {
    if (!selectedProteinId) return [];
    const [uId, pId] = selectedProteinId.split('_');
    return mutations.filter((m) => m.uniprot_id === uId && m.pdb_id === pId);
  }, [mutations, selectedProteinId]);

  // Set default experiment ID when protein changes
  useEffect(() => {
    if (availableMutations.length > 0) {
      setSelectedExpId(availableMutations[0].experiment_id);
    }
  }, [availableMutations]);

  // Selected mutation object
  const currentMutation = availableMutations.find((m) => m.experiment_id === selectedExpId) || availableMutations[0];

  // Predictions for selected mutation
  const currentPredictions = selectedExpId && predictionsMap[selectedExpId] ? predictionsMap[selectedExpId] : null;

  // Feature data for selected mutation
  const current3dFeatures = selectedExpId ? features3dMap[selectedExpId] : null;
  const currentCmFeatures = selectedExpId ? featuresCmMap[selectedExpId] : null;

  if (mutations.length === 0) {
    return (
      <div style={{ padding: '64px', textAlign: 'center', color: '#5a5852' }}>
        Loading benchmark mutation data...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', color: '#11110F' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#11110F', background: '#D8FF4F', display: 'inline-block', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontFamily: 'monospace' }}>
          MUTATION EXPLORER
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 8px 0', color: '#11110F' }}>
          Explore a Mutation
        </h1>
        <p style={{ fontSize: '1rem', color: '#5a5852', margin: 0 }}>
          Follow one experimental mutation through five different protein representations.
        </p>
      </div>

      {/* SELECTORS BAR */}
      <div
        style={{
          background: '#F8F7F3',
          border: '1px solid #D8D5CC',
          borderRadius: '8px',
          padding: '20px 24px',
          marginBottom: '32px',
          display: 'flex',
          gap: '24px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        {/* Protein Selector */}
        <div style={{ flex: '1 1 280px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#5a5852', textTransform: 'uppercase', marginBottom: '6px' }}>
            1. Select Protein / PDB
          </label>
          <select
            value={selectedProteinId}
            onChange={(e) => setSelectedProteinId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: '#ffffff',
              border: '1px solid #D8D5CC',
              borderRadius: '6px',
              color: '#11110F',
              fontSize: '0.9rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {proteinOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.pdbId} ({opt.uniprotId}) &bull; {opt.count} FireProt mutations
              </option>
            ))}
          </select>
        </div>

        {/* Mutation Selector */}
        <div style={{ flex: '1 1 280px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#5a5852', textTransform: 'uppercase', marginBottom: '6px' }}>
            2. Select Mutation
          </label>
          <select
            value={selectedExpId}
            onChange={(e) => setSelectedExpId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: '#ffffff',
              border: '1px solid #D8D5CC',
              borderRadius: '6px',
              color: '#11110F',
              fontSize: '0.9rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {availableMutations.map((m, idx) => (
              <option key={`${m.experiment_id}_${m.mutation}_${idx}`} value={m.experiment_id}>
                {m.mutation} (PDB Res #{m.pdb_position}) &bull; ΔΔG = {m.ddG.toFixed(2)} kcal/mol [{m.split.toUpperCase()}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {currentMutation && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '32px' }}>
          {/* LEFT COLUMN: 3D MOLECULAR STRUCTURE VIEWER */}
          <div>
            <PdbStructureViewer3D
              pdbId={currentMutation.pdb_id}
              chain={currentMutation.chain}
              pdbPosition={currentMutation.pdb_position}
              wtAa={currentMutation.wt_aa}
              mutAa={currentMutation.mut_aa}
            />

            <div style={{ marginTop: '16px', background: '#F8F7F3', border: '1px solid #D8D5CC', borderRadius: '8px', padding: '14px', fontSize: '0.8rem', color: '#5a5852', lineHeight: 1.5 }}>
              <strong style={{ color: '#11110F' }}>Molecular Centerpiece Note:</strong><br />
              The viewer displays the authentic experimental wild-type PDB structure ({currentMutation.pdb_id}) and highlights the residue where FireProt reports the mutation ({currentMutation.wt_aa}{currentMutation.pdb_position}{currentMutation.mut_aa}). It does NOT display a predicted mutant 3D structure.
            </div>
          </div>

          {/* RIGHT COLUMN: MUTATION DETAILS, REPRESENTATION PANELS & PREDICTION */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* MUTATION DETAILS CARD */}
            <div style={{ background: '#11110F', border: '1px solid #2A2925', borderRadius: '8px', padding: '20px', color: '#F8F7F2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D8FF4F', fontFamily: 'monospace' }}>
                    {currentMutation.wt_aa} → {currentMutation.mut_aa}
                  </span>
                  <span style={{ padding: '3px 8px', background: '#2A2925', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#F8F7F2' }}>
                    Pos #{currentMutation.position} (PDB #{currentMutation.pdb_position})
                  </span>
                </div>

                <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', background: currentMutation.split === 'test' ? '#e11d48' : '#10b981', color: currentMutation.split === 'test' ? '#ffffff' : '#022c22' }}>
                  {currentMutation.split.toUpperCase()} SET
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center', background: '#1c1b18', padding: '12px', borderRadius: '6px' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#a3a199', textTransform: 'uppercase' }}>UniProt ID</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F8F7F2' }}>{currentMutation.uniprot_id}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#a3a199', textTransform: 'uppercase' }}>Experimental PDB</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#D8FF4F' }}>{currentMutation.pdb_id} ({currentMutation.chain})</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#a3a199', textTransform: 'uppercase' }}>Experimental ΔΔG</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: currentMutation.ddG < 0 ? '#10b981' : '#f43f5e' }}>
                    {currentMutation.ddG.toFixed(2)} kcal/mol
                  </div>
                </div>
              </div>
            </div>

            {/* REPRESENTATION SWITCHER TABS */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5a5852', textTransform: 'uppercase', marginBottom: '8px' }}>
                Select Representation Paradigm
              </div>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                <button
                  onClick={() => setActiveRepTab('sequence')}
                  style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, background: activeRepTab === 'sequence' ? '#11110F' : '#ECEAE4', color: activeRepTab === 'sequence' ? '#D8FF4F' : '#5a5852', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                >
                  <Dna size={14} /> Sequence (252D)
                </button>
                <button
                  onClick={() => setActiveRepTab('esm')}
                  style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, background: activeRepTab === 'esm' ? '#11110F' : '#ECEAE4', color: activeRepTab === 'esm' ? '#D8FF4F' : '#5a5852', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                >
                  <Cpu size={14} /> ESM-2 (1280D)
                </button>
                <button
                  onClick={() => setActiveRepTab('3d')}
                  style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, background: activeRepTab === '3d' ? '#11110F' : '#ECEAE4', color: activeRepTab === '3d' ? '#D8FF4F' : '#5a5852', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                >
                  <Box size={14} /> WT 3D (131D)
                </button>
                <button
                  onClick={() => setActiveRepTab('contact_map')}
                  style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, background: activeRepTab === 'contact_map' ? '#11110F' : '#ECEAE4', color: activeRepTab === 'contact_map' ? '#D8FF4F' : '#5a5852', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                >
                  <Share2 size={14} /> Contact Map (107D)
                </button>
                <button
                  onClick={() => setActiveRepTab('gnn')}
                  style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, background: activeRepTab === 'gnn' ? '#11110F' : '#ECEAE4', color: activeRepTab === 'gnn' ? '#D8FF4F' : '#5a5852', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                >
                  <Sparkles size={14} /> Protein GNN
                </button>
              </div>

              {/* Active Panel View */}
              <div style={{ marginTop: '12px' }}>
                {activeRepTab === 'sequence' && <SequencePanel mutation={currentMutation} />}
                {activeRepTab === 'esm' && <ESMPanel mutation={currentMutation} />}
                {activeRepTab === '3d' && <StructurePanel mutation={currentMutation} featureData={current3dFeatures} />}
                {activeRepTab === 'contact_map' && <ContactMapPanel mutation={currentMutation} featureData={currentCmFeatures} />}
                {activeRepTab === 'gnn' && <GNNPanel mutation={currentMutation} />}
              </div>
            </div>

            {/* PREDICTION PANEL */}
            <div style={{ background: '#F8F7F3', border: '1px solid #D8D5CC', borderRadius: '8px', padding: '20px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#11110F', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Stability Prediction (&Delta;&Delta;G)
              </h4>

              {currentPredictions ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ background: '#ffffff', border: '1px solid #D8D5CC', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: '#5a5852', fontWeight: 700 }}>GNN Pred</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#9333ea' }}>
                        {currentPredictions.gnn !== undefined ? `${currentPredictions.gnn.toFixed(2)} kcal/mol` : 'N/A'}
                      </div>
                    </div>
                    <div style={{ background: '#ffffff', border: '1px solid #D8D5CC', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: '#5a5852', fontWeight: 700 }}>WT 3D Pred</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10b981' }}>
                        {currentPredictions['3d'] !== undefined ? `${currentPredictions['3d'].toFixed(2)} kcal/mol` : 'N/A'}
                      </div>
                    </div>
                    <div style={{ background: '#ffffff', border: '1px solid #D8D5CC', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: '#5a5852', fontWeight: 700 }}>Contact Map Pred</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#e11d48' }}>
                        {currentPredictions.contact_map !== undefined ? `${currentPredictions.contact_map.toFixed(2)} kcal/mol` : 'N/A'}
                      </div>
                    </div>
                    <div style={{ background: '#ffffff', border: '1px solid #D8D5CC', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: '#5a5852', fontWeight: 700 }}>Sequence Pred</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#4f46e5' }}>
                        {currentPredictions.sequence !== undefined ? `${currentPredictions.sequence.toFixed(2)} kcal/mol` : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#ECEAE4', padding: '10px 14px', borderRadius: '6px', fontSize: '0.75rem', color: '#5a5852', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Experimental Ground Truth: <strong style={{ color: '#11110F' }}>{currentMutation.ddG.toFixed(2)} kcal/mol</strong></span>
                    <span>Convention: <span style={{ color: '#10b981', fontWeight: 700 }}>&Delta;&Delta;G &lt; 0 stabilizing</span> &bull; <span style={{ color: '#e11d48', fontWeight: 700 }}>&Delta;&Delta;G &gt; 0 destabilizing</span></span>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: '#7a776e', fontStyle: 'italic' }}>
                  Prediction not available in current prototype for experiment ID #{currentMutation.experiment_id}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
