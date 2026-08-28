import React, { useState, useEffect } from 'react';
import { MutationItem, BenchmarkComparisonItem, FeatureImportanceItem } from './types/benchmark';
import { Navbar } from './components/layout/Navbar';
import { HomeView } from './components/views/HomeView';
import { ExploreView } from './components/views/ExploreView';
import { ResearchView } from './components/views/ResearchView';
import { BenchmarkView } from './components/views/BenchmarkView';
import { InterpretabilityView } from './components/views/InterpretabilityView';
import { DataView } from './components/views/DataView';
import { InteractiveBackground } from './components/common/InteractiveBackground';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [presentationMode, setPresentationMode] = useState<boolean>(false);
  const [mutations, setMutations] = useState<MutationItem[]>([]);
  const [benchmarkComparison, setBenchmarkComparison] = useState<BenchmarkComparisonItem[]>([]);
  const [predictionsMap, setPredictionsMap] = useState<Record<string, Record<string, number>>>({});
  const [features3dMap, setFeatures3dMap] = useState<Record<string, any>>({});
  const [featuresCmMap, setFeaturesCmMap] = useState<Record<string, any>>({});
  const [featureImportanceData, setFeatureImportanceData] = useState<Record<string, FeatureImportanceItem[]>>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Load static data artifacts on mount
  useEffect(() => {
    Promise.all([
      fetch('/data/mutations.json').then((res) => (res.ok ? res.json() : [])).catch(() => []),
      fetch('/data/benchmark_comparison.json').then((res) => (res.ok ? res.json() : [])).catch(() => []),
      fetch('/data/predictions_map.json').then((res) => (res.ok ? res.json() : {})).catch(() => ({})),
      fetch('/data/features_3d_map.json').then((res) => (res.ok ? res.json() : {})).catch(() => ({})),
      fetch('/data/features_cm_map.json').then((res) => (res.ok ? res.json() : {})).catch(() => ({})),
      fetch('/data/3d_feature_importance.json').then((res) => (res.ok ? res.json() : [])).catch(() => []),
      fetch('/data/contact_map_feature_importance.json').then((res) => (res.ok ? res.json() : [])).catch(() => []),
      fetch('/data/sequence_feature_importance.json').then((res) => (res.ok ? res.json() : [])).catch(() => [])
    ])
      .then(([muts, comp, predMap, f3dMap, fCmMap, imp3d, impCm, impSeq]) => {
        setMutations(muts);
        setBenchmarkComparison(comp);
        setPredictionsMap(predMap);
        setFeatures3dMap(f3dMap);
        setFeaturesCmMap(fCmMap);
        setFeatureImportanceData({
          '3d': imp3d,
          'contact_map': impCm,
          'sequence': impSeq
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed loading frontend benchmark artifacts:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: presentationMode ? '#11110F' : '#FBF9F5',
        color: presentationMode ? '#FBF9F5' : '#11110F',
        fontFamily: 'Inter, system-ui, sans-serif',
        position: 'relative'
      }}
    >
      {/* Dynamic Interactive Background Canvas */}
      {!presentationMode && <InteractiveBackground />}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        presentationMode={presentationMode}
        onTogglePresentationMode={() => setPresentationMode(!presentationMode)}
      />

      {/* Main Page Workspace */}
      <main style={{ flex: 1, padding: presentationMode ? '48px 48px 80px' : '36px 32px 64px', position: 'relative', zIndex: 1 }}>
        {activeTab === 'home' && <HomeView onNavigate={setActiveTab} />}
        {activeTab === 'explore' && (
          <ExploreView
            mutations={mutations}
            predictionsMap={predictionsMap}
            features3dMap={features3dMap}
            featuresCmMap={featuresCmMap}
            featureImportanceData={featureImportanceData}
          />
        )}
        {activeTab === 'research' && (
          <ResearchView
            onNavigate={setActiveTab}
            comparisonData={benchmarkComparison}
            featureImportanceData={featureImportanceData}
          />
        )}
        {activeTab === 'benchmark' && <BenchmarkView comparisonData={benchmarkComparison} />}
        {activeTab === 'interpretability' && <InterpretabilityView featureImportanceData={featureImportanceData} />}
        {activeTab === 'data' && <DataView />}
      </main>

      {/* Footer */}
      {!presentationMode && (
        <footer
          style={{
            borderTop: '1px solid #11110F',
            padding: '24px 32px',
            background: '#F5F3EE',
            fontSize: '0.75rem',
            color: '#52504a',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            position: 'relative',
            zIndex: 1
          }}
        >
          <div style={{ fontFamily: 'monospace', fontWeight: 700 }}>
            reppred &bull; PROTEIN REPRESENTATION BENCHMARK &copy; 2026 &bull; PROTBENCH RESEARCH INSTRUMENT
          </div>
          <div style={{ fontFamily: 'monospace', display: 'flex', gap: '20px' }}>
            <span>MUTATIONS: 3,433 MAPPED</span>
            <span>STRUCTURES: 100 EXPERIMENTAL WT PDBs</span>
            <span>PARADIGMS: 5 REPRESENTATIONS</span>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
