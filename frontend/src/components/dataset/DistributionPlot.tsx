import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { MutationRecord } from '../../types';

interface DistributionPlotProps {
  mutations: MutationRecord[];
  measurementType?: string;
  units?: string;
}

export const DistributionPlot: React.FC<DistributionPlotProps> = ({
  mutations,
  units = ''
}) => {
  if (!mutations.length) return null;

  const vals = mutations.map((m) => m.measurement);
  const minVal = Math.min(...vals);
  const maxVal = Math.max(...vals);

  const numBins = 18;
  const binWidth = (maxVal - minVal) / numBins || 1;

  const bins: { binStart: number; binEnd: number; binLabel: string; count: number }[] = [];
  for (let i = 0; i < numBins; i++) {
    const start = minVal + i * binWidth;
    const end = start + binWidth;
    bins.push({
      binStart: start,
      binEnd: end,
      binLabel: `${start.toFixed(1)}`,
      count: 0
    });
  }

  vals.forEach((v) => {
    let bIdx = Math.floor((v - minVal) / binWidth);
    if (bIdx >= numBins) bIdx = numBins - 1;
    if (bIdx < 0) bIdx = 0;
    bins[bIdx].count++;
  });

  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;

  return (
    <div className="panel-dark">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '10px' }}>
        <div>
          <span className="hero-label" style={{ color: 'var(--accent)' }}>DISTRIBUTION</span>
          <h4 style={{ fontSize: '1rem', color: 'var(--white)', marginTop: '2px' }}>Experimental Value Spread</h4>
        </div>
        <div className="mono" style={{ fontSize: '0.75rem', color: '#c5c3bc' }}>
          MEAN: <strong style={{ color: 'var(--accent)' }}>{mean.toFixed(2)}</strong> {units} (N={mutations.length})
        </div>
      </div>

      <div style={{ width: '100%', height: '180px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bins} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="binLabel"
              stroke="#475569"
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            />
            <YAxis
              stroke="#475569"
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            />
            <Tooltip
              content={({ payload }) => {
                if (!payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={{ background: '#1c1b18', border: '1px solid var(--border-dark)', padding: '6px 10px', borderRadius: '2px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ color: 'var(--accent)' }}>{d.binStart.toFixed(2)} to {d.binEnd.toFixed(2)} {units}</div>
                    <div style={{ color: 'var(--white)' }}>Count: <strong>{d.count}</strong> variants</div>
                  </div>
                );
              }}
            />
            <ReferenceLine x={mean.toFixed(1)} stroke="#D8FF4F" strokeDasharray="3 3" label={{ value: 'Mean', fill: '#D8FF4F', fontSize: 10 }} />
            <Bar dataKey="count" fill="#4A4842" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
