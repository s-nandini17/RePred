import React from 'react';
import { BenchmarkResponse } from '../../types';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Badge } from '../common/Badge';

interface SoftmaxPreferenceViewProps {
  benchmarkData: BenchmarkResponse;
}

export const SoftmaxPreferenceView: React.FC<SoftmaxPreferenceViewProps> = ({
  benchmarkData
}) => {
  const prefs = benchmarkData.secondary_relative_preferences_percent || {};
  const data = Object.entries(prefs).map(([repId, pct]) => {
    const card = benchmarkData.leaderboard?.find((r) => r.representation_id === repId);
    return {
      name: card?.representation_name || repId,
      pct,
      repId
    };
  });

  const colors = ['#D8FF4F', '#F8F7F2', '#A8A69E', '#6E6C65', '#4A4842', '#32312C', '#1F1E1A'];

  return (
    <div className="panel-dark">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '10px' }}>
        <div>
          <span className="hero-label" style={{ color: 'var(--accent)' }}>RELATIVE PREFERENCE (SECONDARY)</span>
          <h4 style={{ fontSize: '1rem', color: 'var(--white)', marginTop: '2px' }}>Softmax Distribution Across Modalities</h4>
        </div>
        <Badge variant="dark">Relative Distribution</Badge>
      </div>

      <p style={{ fontSize: '0.8125rem', color: '#c5c3bc', marginBottom: '16px', lineHeight: '1.5' }}>
        <strong>Scientific Distinction:</strong> Softmax expresses relative probability preference among the evaluated representations. It is a secondary comparative visualization and is <em>not</em> the primary absolute benchmark score.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', alignItems: 'center' }}>
        {/* Pie Chart */}
        <div style={{ width: '240px', height: '200px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={80}
                paddingAngle={2}
                dataKey="pct"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="#11110F" />
                ))}
              </Pie>
              <Tooltip
                content={({ payload }) => {
                  if (!payload || !payload.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={{ background: '#1c1b18', border: '1px solid var(--border-dark)', padding: '6px 10px', borderRadius: '2px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                      <div style={{ color: 'var(--white)', fontWeight: 600 }}>{d.name}</div>
                      <div style={{ color: 'var(--accent)' }}>{d.pct}% relative preference</div>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.map((item, idx) => (
            <div key={item.repId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '1px', background: colors[idx % colors.length] }} />
                <span className="mono" style={{ color: 'var(--white)' }}>{item.name}</span>
              </div>
              <span className="mono" style={{ fontWeight: 600, color: idx === 0 ? 'var(--accent)' : '#A8A69E' }}>
                {item.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
