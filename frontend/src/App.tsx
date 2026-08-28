import React, { useState, useEffect } from 'react';
import { ProteinSummary, DatasetSummary, StructureData, RepresentationInfo } from './types';
import { ApiService } from './services/api';
import { Header } from './components/layout/Header';
import { ProteinHub } from './components/protein/ProteinHub';
import { DatasetExplorer } from './components/dataset/DatasetExplorer';
import { RepresentationExplorer } from './components/representations/RepresentationExplorer';
import { PredictionWorkbench } from './components/prediction/PredictionWorkbench';
import { BenchmarkDashboard } from './components/benchmark/BenchmarkDashboard';
import { CompareView } from './components/compare/CompareView';
import { AlertBanner } from './components/common/AlertBanner';
import { ArrowRight, Layers } from 'lucide-react';

export function App() {
  const [proteins, setProteins] = useState<ProteinSummary[]>([]);
  const [selectedProteinId, setSelectedProteinId] = useState<string>('tem1');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('stability');
  const [activeTab, setActiveTab] = useState<string>('benchmark');
  const [structure, setStructure] = useState<StructureData | null>(null);
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [representations, setRepresentations] = useState<RepresentationInfo[]>([]);
  const [targetMutationForPredict, setTargetMutationForPredict] = useState<string>('M182T');
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);

  // Load proteins on mount
  useEffect(() => {
    ApiService.getProteins()
      .then((res) => setProteins(res))
      .catch((err) => console.error('Failed to load proteins:', err));
  }, []);

  // When selected protein changes, update structure & datasets & supported tasks
  useEffect(() => {
    if (!selectedProteinId) return;

    ApiService.getProteinDetails(selectedProteinId)
      .then((det) => {
        setDatasets(det.datasets);
        if (det.metadata.tasks.length && !det.metadata.tasks.includes(selectedTaskId)) {
          setSelectedTaskId(det.metadata.tasks[0]);
        }
      })
      .catch((err) => console.error('Failed to load protein details:', err));

    ApiService.getProteinStructure(selectedProteinId)
      .then((struct) => setStructure(struct))
      .catch((err) => console.error('Failed to load structure:', err));

    ApiService.getRepresentations(selectedProteinId)
      .then((reps) => setRepresentations(reps))
      .catch((err) => console.error('Failed to load representations:', err));
  }, [selectedProteinId]);

  const currentProtein = proteins.find((p) => p.id === selectedProteinId);

  const handleSelectMutationForPredict = (mutationStr: string) => {
    setTargetMutationForPredict(mutationStr);
    setActiveTab('prediction');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Top Minimal Navigation Bar */}
      <Header
        proteins={proteins}
        selectedProteinId={selectedProteinId}
        onSelectProtein={(id) => {
          setSelectedProteinId(id);
          setSelectedPosition(null);
        }}
        selectedTaskId={selectedTaskId}
        onSelectTask={setSelectedTaskId}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        availableTasks={currentProtein?.tasks || ['stability']}
      />

      {/* Hero Header Section */}
      <section style={{ borderBottom: '1px solid var(--border)', padding: '56px 32px 48px', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
        <div className="hero-label">PROTEIN REPRESENTATION ENGINE</div>
        <h1 className="hero-title">
          <span>Design space,</span>
          <span>made measurable.</span>
        </h1>
        <p className="hero-subtitle">
          Evaluate protein representations through sequence, structure, and biological-function benchmarks against experimentally measured deep mutational scanning assays.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('benchmark')}
            className="btn-primary"
            style={{ padding: '12px 24px', fontSize: '0.875rem' }}
          >
            Explore benchmark <ArrowRight size={14} />
          </button>
          <button
            onClick={() => setActiveTab('representations')}
            className="btn-secondary"
            style={{ padding: '12px 24px', fontSize: '0.875rem' }}
          >
            <Layers size={14} /> View representations
          </button>
        </div>
      </section>

      {/* Main Content Workspace */}
      <main style={{ flex: 1, padding: '36px 32px', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
        {/* Scientific Integrity Banner */}
        <div style={{ marginBottom: '28px' }}>
          <AlertBanner
            type="integrity"
            title="SCIENTIFIC INTEGRITY PRINCIPLE"
            message="Every representation score is calculated mathematically from 5-fold cross-validation on authentic experimental deep mutational scanning (DMS) datasets. A score of 10.0 represents performance matching the defined ideal benchmark (Spearman ρ = 1.0), not absolute biological perfection."
          />
        </div>

        {/* Tab 1: Protein Hub */}
        {activeTab === 'protein' && (
          <ProteinHub
            proteinId={selectedProteinId}
            onNavigateToDataset={() => setActiveTab('dataset')}
            onNavigateToBenchmark={() => setActiveTab('benchmark')}
          />
        )}

        {/* Tab 2: Dataset Explorer */}
        {activeTab === 'dataset' && (
          <DatasetExplorer
            proteinId={selectedProteinId}
            datasets={datasets}
            sequenceLength={structure?.length || 263}
            onSelectMutationForPredict={handleSelectMutationForPredict}
          />
        )}

        {/* Tab 3: Representation Deep Dive */}
        {activeTab === 'representations' && (
          <RepresentationExplorer
            structure={structure}
            representations={representations}
            selectedPosition={selectedPosition}
            onSelectPosition={setSelectedPosition}
          />
        )}

        {/* Tab 4: Prediction Workbench */}
        {activeTab === 'prediction' && (
          <PredictionWorkbench
            proteinId={selectedProteinId}
            taskId={selectedTaskId}
            defaultMutation={targetMutationForPredict}
          />
        )}

        {/* Tab 5: Benchmark Leaderboard */}
        {activeTab === 'benchmark' && (
          <BenchmarkDashboard
            proteinId={selectedProteinId}
            taskId={selectedTaskId}
          />
        )}

        {/* Tab 6: Compare & Perfect Check */}
        {activeTab === 'compare' && (
          <CompareView
            proteinId={selectedProteinId}
            taskId={selectedTaskId}
          />
        )}
      </main>

      {/* Minimal Editorial Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          padding: '24px 32px',
          background: 'var(--bg-secondary)',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div className="mono">
          PROTEIN BENCHMARK ENGINE &copy; 2026 &bull; COMPUTATIONAL BIOLOGY RESEARCH INSTRUMENT
        </div>
        <div className="mono" style={{ display: 'flex', gap: '20px' }}>
          <span>SOURCES: PROTEINGYM &amp; RCSB PDB</span>
          <span>EVALUATOR: 5-FOLD POSITION-AWARE CV</span>
          <span>SCORING: IDEAL BENCHMARK NORMALIZATION</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
