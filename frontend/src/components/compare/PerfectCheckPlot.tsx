import React, { useState, useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { BenchmarkResponse } from '../../types';
import { Badge } from '../common/Badge';

interface PerfectCheckPlotProps {
  benchmarkData: BenchmarkResponse;
}

export const PerfectCheckPlot: React.FC<PerfectCheckPlotProps> = ({
  benchmarkData
}) => {
  const defaultRep = benchmarkData.leaderboard?.[0]?.representation_id || 'all_multimodal';
  const [selectedRep, setSelectedRep] = useState<string>(defaultRep);

  const expVals = useMemo(() => benchmarkData.experimental_ground_truth || [], [benchmarkData]);
  const predVals = useMemo(() => benchmarkData.predictions_by_representation?.[selectedRep] || [], [benchmarkData, selectedRep]);
  const mutations = useMemo(() => benchmarkData.mutation_identifiers || [], [benchmarkData]);

  // Safe min/max calculation
  const { minVal, maxVal } = useMemo(() => {
    let minV = 0;
    let maxV = 1;
    if (expVals.length > 0) {
      minV = expVals[0];
      maxV = expVals[0];
      for (let i = 0; i < expVals.length; i++) {
        const e = expVals[i];
        const p = predVals[i] !== undefined ? predVals[i] : e;
        if (e < minV) minV = e;
        if (e > maxV) maxV = e;
        if (p < minV) minV = p;
        if (p > maxV) maxV = p;
      }
    }
    return { minVal: minV - 0.5, maxVal: maxV + 0.5 };
  }, [expVals, predVals]);

  // Build scatter points
  const points = useMemo(() => {
    const pts = [];
    const limit = Math.min(expVals.length, 250);
    for (let i = 0; i < limit; i++) {
      const exp = expVals[i];
      const pred = predVals[i] !== undefined ? predVals[i] : exp;
      pts.push({
        exp,
        pred,
        mutation: mutations[i] || `Mut_${i + 1}`,
        residual: Math.abs(pred - exp)
      });
    }
    return pts;
  }, [expVals, predVals, mutations]);

  const activeRep = benchmarkData.leaderboard?.find((r) => r.representation_id === selectedRep) || benchmarkData.leaderboard?.[0];

  return (
    <div className="panel-dark">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '12px' }}>
        <div>
          <span className="hero-label" style={{ color: 'var(--accent)' }}>IDEAL REFERENCE VALIDATION</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--white)' }}>"Perfect Check" (y = x) Scatter Alignment</h3>
            <Badge variant="dark">Ground Truth Reference</Badge>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#c5c3bc', marginTop: '4px' }}>
            Points on the dashed diagonal line represent exact agreement between predicted and experimental measurements.
          </p>
        </div>

        {/* Representation Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="mono" style={{ fontSize: '0.75rem', color: '#A8A69E' }}>MODALITY:</span>
          <select
            value={selectedRep}
            onChange={(e) => setSelectedRep(e.target.value)}
            className="select-dark"
            style={{ fontWeight: 500 }}
          >
            {benchmarkData.leaderboard?.map((r) => (
              <option key={r.representation_id} value={r.representation_id}>
                {r.representation_name} ({r.final_score.toFixed(1)}/10)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Summary Line */}
      {activeRep && (
        <div className="mono" style={{ display: 'flex', gap: '20px', marginBottom: '16px', fontSize: '0.75rem', color: '#A8A69E' }}>
          <div>SPEARMAN ρ: <strong style={{ color: 'var(--accent)' }}>{(activeRep.all_metrics?.spearman_rho || 0).toFixed(3)}</strong></div>
          <div>PEARSON r: <strong style={{ color: 'var(--white)' }}>{(activeRep.all_metrics?.pearson_r || 0).toFixed(3)}</strong></div>
          <div>RMSE: <strong style={{ color: 'var(--white)' }}>{(activeRep.all_metrics?.rmse || 0).toFixed(3)}</strong></div>
          <div>BENCHMARK SCORE: <strong style={{ color: 'var(--accent)' }}>{activeRep.final_score.toFixed(1)} / 10</strong></div>
        </div>
      )}

      {/* Scatter Chart */}
      <div style={{ width: '100%', height: '340px', background: '#0D0D0C', borderRadius: '2px', border: '1px solid var(--border-dark)', padding: '10px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <XAxis
              type="number"
              dataKey="exp"
              name="Experimental Measurement"
              domain={[Math.floor(minVal), Math.ceil(maxVal)]}
              stroke="#475569"
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            />
            <YAxis
              type="number"
              dataKey="pred"
              name="Predicted Measurement"
              domain={[Math.floor(minVal), Math.ceil(maxVal)]}
              stroke="#475569"
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            />
            <ZAxis range={[40, 40]} />
            <Tooltip
              content={({ payload }) => {
                if (!payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={{ background: '#1c1b18', border: '1px solid var(--border-dark)', padding: '8px 12px', borderRadius: '2px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--accent)' }}>{d.mutation}</div>
                    <div style={{ color: 'var(--white)' }}>Experimental: <strong>{Number(d.exp).toFixed(3)}</strong></div>
                    <div style={{ color: '#F8F7F2' }}>Predicted: <strong>{Number(d.pred).toFixed(3)}</strong></div>
                    <div style={{ color: 'var(--text-muted)' }}>Residual (|Δ|): {Number(d.residual).toFixed(3)}</div>
                  </div>
                );
              }}
            />
            {/* Ideal y = x line */}
            <ReferenceLine
              segment={[{ x: minVal, y: minVal }, { x: maxVal, y: maxVal }]}
              stroke="#ffffff"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{ value: 'Perfect (y = x)', fill: '#ffffff', fontSize: 10, position: 'insideTopLeft' }}
            />
            <Scatter name="Mutations" data={points}>
              {points.map((entry, index) => {
                const color = entry.residual < 0.4 ? '#D8FF4F' : entry.residual < 0.9 ? '#F8F7F2' : '#f43f5e';
                return <Cell key={`cell-${index}`} fill={color} fillOpacity={0.8} />;
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
