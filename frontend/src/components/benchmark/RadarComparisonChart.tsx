import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import { ScoreCard } from '../../types';

interface RadarComparisonChartProps {
  leaderboard: ScoreCard[];
}

export const RadarComparisonChart: React.FC<RadarComparisonChartProps> = ({
  leaderboard
}) => {
  if (!leaderboard.length) return null;

  const topReps = leaderboard.slice(0, 3);

  const metricsList = [
    { key: 'spearman_rho', label: 'Spearman ρ', max: 1.0 },
    { key: 'pearson_r', label: 'Pearson r', max: 1.0 },
    { key: 'r2', label: 'R² Score', max: 1.0 },
    { key: 'mae_norm', label: '1 - MAE', max: 1.0 },
    { key: 'rmse_norm', label: '1 - RMSE', max: 1.0 }
  ];

  const radarData = metricsList.map((m) => {
    const row: any = { metric: m.label };
    topReps.forEach((rep) => {
      let val = 0;
      if (m.key === 'spearman_rho') val = Math.max(0, rep.all_metrics?.spearman_rho || 0);
      else if (m.key === 'pearson_r') val = Math.max(0, rep.all_metrics?.pearson_r || 0);
      else if (m.key === 'r2') val = Math.max(0, rep.all_metrics?.r2 || 0);
      else if (m.key === 'mae_norm') val = Math.max(0, 1 - (rep.all_metrics?.mae || 0));
      else if (m.key === 'rmse_norm') val = Math.max(0, 1 - (rep.all_metrics?.rmse || 0));

      row[rep.representation_name] = Math.min(1.0, val);
    });
    return row;
  });

  const colors = ['#D8FF4F', '#F8F7F2', '#8E8C84'];

  return (
    <div className="panel-dark">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '10px' }}>
        <div>
          <span className="hero-label" style={{ color: 'var(--accent)' }}>MULTI-METRIC RADAR</span>
          <h4 style={{ fontSize: '1rem', color: 'var(--white)', marginTop: '2px' }}>Cross-Modality Metric Profile</h4>
        </div>
      </div>

      <div style={{ width: '100%', height: '280px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <PolarGrid stroke="#2A2925" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: '#A8A69E', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 1]}
              stroke="#2A2925"
              tick={{ fill: '#57554F', fontSize: 9 }}
            />
            <Tooltip
              content={({ payload }) => {
                if (!payload || !payload.length) return null;
                return (
                  <div style={{ background: '#1c1b18', border: '1px solid var(--border-dark)', padding: '8px 12px', borderRadius: '2px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--white)', marginBottom: '4px' }}>{payload[0].payload.metric}</div>
                    {payload.map((entry: any, index: number) => (
                      <div key={`item-${index}`} style={{ color: entry.color, display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                        <span>{entry.name}:</span>
                        <strong>{Number(entry.value).toFixed(3)}</strong>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                paddingTop: '10px'
              }}
            />
            {topReps.map((rep, idx) => (
              <Radar
                key={rep.representation_id}
                name={rep.representation_name}
                dataKey={rep.representation_name}
                stroke={colors[idx]}
                fill={colors[idx]}
                fillOpacity={idx === 0 ? 0.25 : 0.1}
                strokeWidth={idx === 0 ? 2 : 1.5}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
