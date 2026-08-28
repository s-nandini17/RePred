import React, { useState, useEffect } from 'react';
import { BenchmarkResponse } from '../../types';
import { ApiService } from '../../services/api';
import { PerfectCheckPlot } from './PerfectCheckPlot';
import { SoftmaxPreferenceView } from './SoftmaxPreferenceView';
import { RadarComparisonChart } from '../benchmark/RadarComparisonChart';
import { RefreshCw } from 'lucide-react';

interface CompareViewProps {
  proteinId: string;
  taskId: string;
  initialBenchmarkData?: BenchmarkResponse | null;
}

export const CompareView: React.FC<CompareViewProps> = ({
  proteinId,
  taskId,
  initialBenchmarkData
}) => {
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkResponse | null>(initialBenchmarkData || null);
  const [loading, setLoading] = useState<boolean>(!initialBenchmarkData);

  useEffect(() => {
    let isMounted = true;
    if (initialBenchmarkData && initialBenchmarkData.protein_id === proteinId && initialBenchmarkData.task_id === taskId) {
      setBenchmarkData(initialBenchmarkData);
      setLoading(false);
      return;
    }

    setLoading(true);
    ApiService.getBenchmark(proteinId, taskId)
      .then((res) => {
        if (isMounted) {
          setBenchmarkData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load benchmark data for comparison:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [proteinId, taskId, initialBenchmarkData]);

  if (loading) {
    return (
      <div className="panel-light" style={{ padding: '60px', textAlign: 'center' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--text-muted)' }} />
        <div className="mono" style={{ fontSize: '0.875rem' }}>Loading Comparative Analytics...</div>
      </div>
    );
  }

  if (!benchmarkData) {
    return <div className="panel-light" style={{ padding: '30px' }}>No comparative benchmark data available.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Section Header */}
      <div className="section-header">
        <div>
          <span className="hero-label">COMPARATIVE ANALYTICS</span>
          <h2 className="section-title">Multi-Representation Evaluation</h2>
          <p className="section-subtitle">
            Side-by-side empirical performance comparison and ideal-reference validation.
          </p>
        </div>
      </div>

      {/* 1. Perfect Check Plot */}
      <PerfectCheckPlot benchmarkData={benchmarkData} />

      {/* 2. Radar & Multi-Axis Profile */}
      <RadarComparisonChart leaderboard={benchmarkData.leaderboard} />

      {/* 3. Softmax Relative Preference (Secondary) */}
      <SoftmaxPreferenceView benchmarkData={benchmarkData} />
    </div>
  );
};
