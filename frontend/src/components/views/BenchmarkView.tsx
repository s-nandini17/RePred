import React from 'react';
import { BenchmarkComparisonItem } from '../../types/benchmark';
import { Trophy, Award, ShieldCheck, Info, BarChart2 } from 'lucide-react';

interface BenchmarkViewProps {
  comparisonData: BenchmarkComparisonItem[];
}

export const BenchmarkView: React.FC<BenchmarkViewProps> = ({ comparisonData }) => {
  const fallbackData: BenchmarkComparisonItem[] = [
    {
      representation: "ESM-2 8M Learned",
      feature_or_architecture: "1280D + Random Forest",
      test_mae: 1.4335, test_rmse: 2.1452, test_r2: 0.0999, test_pearson: 0.3425, test_spearman: 0.3241,
      grouped_cv_mae_mean: 1.2347, grouped_cv_mae_std: 0.0858, grouped_cv_rmse_mean: 1.6185, grouped_cv_rmse_std: 0.1491, grouped_cv_r2_mean: 0.0913, grouped_cv_r2_std: 0.0630, grouped_cv_pearson_mean: 0.4018, grouped_cv_pearson_std: 0.0731, grouped_cv_spearman_mean: 0.3615, grouped_cv_spearman_std: 0.0596
    },
    {
      representation: "Experimental WT Protein GNN",
      feature_or_architecture: "3-Layer EdgeConv GNN (58D node / 3D edge)",
      test_mae: 1.4520, test_rmse: 2.1421, test_r2: 0.1025, test_pearson: 0.3310, test_spearman: 0.2813,
      grouped_cv_mae_mean: 1.1338, grouped_cv_mae_std: 0.0604, grouped_cv_rmse_mean: 1.5508, grouped_cv_rmse_std: 0.1241, grouped_cv_r2_mean: 0.1650, grouped_cv_r2_std: 0.0475, grouped_cv_pearson_mean: 0.4497, grouped_cv_pearson_std: 0.0955, grouped_cv_spearman_mean: 0.4180, grouped_cv_spearman_std: 0.0848
    },
    {
      representation: "Experimental WT 3D",
      feature_or_architecture: "131D + Random Forest",
      test_mae: 1.4532, test_rmse: 2.1237, test_r2: 0.1178, test_pearson: 0.3534, test_spearman: 0.2542,
      grouped_cv_mae_mean: 1.1474, grouped_cv_mae_std: 0.1068, grouped_cv_rmse_mean: 1.5465, grouped_cv_rmse_std: 0.1846, grouped_cv_r2_mean: 0.1720, grouped_cv_r2_std: 0.0928, grouped_cv_pearson_mean: 0.4953, grouped_cv_pearson_std: 0.1087, grouped_cv_spearman_mean: 0.4472, grouped_cv_spearman_std: 0.1240
    },
    {
      representation: "Experimental WT Contact Map",
      feature_or_architecture: "107D + Random Forest",
      test_mae: 1.4638, test_rmse: 2.1701, test_r2: 0.0788, test_pearson: 0.3095, test_spearman: 0.2048,
      grouped_cv_mae_mean: 1.1234, grouped_cv_mae_std: 0.1080, grouped_cv_rmse_mean: 1.5090, grouped_cv_rmse_std: 0.1800, grouped_cv_r2_mean: 0.2078, grouped_cv_r2_std: 0.1292, grouped_cv_pearson_mean: 0.5214, grouped_cv_pearson_std: 0.1389, grouped_cv_spearman_mean: 0.4749, grouped_cv_spearman_std: 0.1366
    },
    {
      representation: "Hand-Engineered Sequence",
      feature_or_architecture: "252D + Random Forest",
      test_mae: 1.5170, test_rmse: 2.1824, test_r2: 0.0684, test_pearson: 0.2715, test_spearman: 0.1984,
      grouped_cv_mae_mean: 1.2336, grouped_cv_mae_std: 0.0941, grouped_cv_rmse_mean: 1.6727, grouped_cv_rmse_std: 0.1932, grouped_cv_r2_mean: 0.0315, grouped_cv_r2_std: 0.0868, grouped_cv_pearson_mean: 0.3800, grouped_cv_pearson_std: 0.0658, grouped_cv_spearman_mean: 0.3620, grouped_cv_spearman_std: 0.0673
    }
  ];

  const dataToUse = comparisonData && comparisonData.length > 0 ? comparisonData : fallbackData;

  const testSorted = [...dataToUse].sort((a, b) => a.test_mae - b.test_mae);
  const cvSorted = [...dataToUse].sort((a, b) => a.grouped_cv_mae_mean - b.grouped_cv_mae_mean);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', color: '#11110F' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#11110F', background: '#D8FF4F', display: 'inline-block', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontFamily: 'monospace' }}>
          BENCHMARK LEADERBOARD
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 8px 0', color: '#11110F' }}>
          Representation Benchmark
        </h1>
        <p style={{ fontSize: '1rem', color: '#5a5852', margin: 0 }}>
          Same mutations. Same target (ΔΔG). Same evaluation protocol. Different representations.
        </p>
      </div>

      {/* 1. OFFICIAL HELD-OUT TEST VISUALIZATION */}
      <div className="editorial-card-light" style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Trophy size={20} color="#d97706" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#11110F' }}>
            1. Official Held-Out Test Performance (N=350 Test Mutations)
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {testSorted.map((item, idx) => {
            const isBest = idx === 0;
            return (
              <div
                key={item.representation}
                style={{
                  background: isBest ? '#11110F' : '#ffffff',
                  border: isBest ? '1px solid #11110F' : '1px solid #D8D5CC',
                  borderRadius: '6px',
                  padding: '20px',
                  position: 'relative',
                  color: isBest ? '#F8F7F2' : '#11110F'
                }}
              >
                {isBest && (
                  <div style={{ position: 'absolute', top: 12, right: 12, padding: '2px 8px', background: '#D8FF4F', color: '#11110F', borderRadius: '3px', fontSize: '0.65rem', fontWeight: 800, fontFamily: 'monospace' }}>
                    BEST TEST MAE
                  </div>
                )}
                <div style={{ fontSize: '0.75rem', color: isBest ? '#a3a199' : '#6F6D67', fontWeight: 700 }}>RANK #{idx + 1}</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, margin: '4px 0 12px 0' }}>{item.representation}</div>

                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: isBest ? '#D8FF4F' : '#10b981', fontFamily: 'monospace' }}>
                  {item.test_mae.toFixed(4)} <span style={{ fontSize: '0.8rem', color: isBest ? '#a3a199' : '#5a5852' }}>kcal/mol</span>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '0.75rem', color: isBest ? '#a3a199' : '#5a5852', borderTop: isBest ? '1px solid #2A2925' : '1px solid #D8D5CC', paddingTop: '10px' }}>
                  <span>R²: <strong>{item.test_r2.toFixed(4)}</strong></span>
                  <span>Pearson r: <strong>{item.test_pearson.toFixed(4)}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. GROUPED CROSS-PROTEIN CV VISUALIZATION */}
      <div className="editorial-card-light" style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Award size={20} color="#10b981" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#11110F' }}>
            2. What happens on unseen proteins? (Grouped 5-Fold CV, N=3,083)
          </h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: '#5a5852', margin: '0 0 20px 0' }}>
          Strictly isolates proteins by UniProt ID across 5 cross-validation folds. Measures model robustness when generalizing to completely unobserved structural topologies.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {cvSorted.map((item, idx) => {
            const isBestCv = idx === 0;
            return (
              <div
                key={item.representation}
                style={{
                  background: isBestCv ? '#11110F' : '#ffffff',
                  border: isBestCv ? '1px solid #11110F' : '1px solid #D8D5CC',
                  borderRadius: '6px',
                  padding: '20px',
                  position: 'relative',
                  color: isBestCv ? '#F8F7F2' : '#11110F'
                }}
              >
                {isBestCv && (
                  <div style={{ position: 'absolute', top: 12, right: 12, padding: '2px 8px', background: '#D8FF4F', color: '#11110F', borderRadius: '3px', fontSize: '0.65rem', fontWeight: 800, fontFamily: 'monospace' }}>
                    BEST CV MAE &amp; PEARSON
                  </div>
                )}
                <div style={{ fontSize: '0.75rem', color: isBestCv ? '#a3a199' : '#6F6D67', fontWeight: 700 }}>RANK #{idx + 1}</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, margin: '4px 0 12px 0' }}>{item.representation}</div>

                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: isBestCv ? '#D8FF4F' : '#4f46e5', fontFamily: 'monospace' }}>
                  {item.grouped_cv_mae_mean.toFixed(4)} <span style={{ fontSize: '0.8rem', color: isBestCv ? '#a3a199' : '#5a5852' }}>&plusmn; {item.grouped_cv_mae_std.toFixed(4)}</span>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '0.75rem', color: isBestCv ? '#a3a199' : '#5a5852', borderTop: isBestCv ? '1px solid #2A2925' : '1px solid #D8D5CC', paddingTop: '10px' }}>
                  <span>CV R²: <strong>{item.grouped_cv_r2_mean.toFixed(4)}</strong></span>
                  <span>CV Pearson r: <strong>{item.grouped_cv_pearson_mean.toFixed(4)}</strong></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Nuanced Scientific Explanation Banner */}
        <div style={{ marginTop: '24px', background: '#11110F', color: '#F8F7F2', borderRadius: '6px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <Info size={18} color="#D8FF4F" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
            <strong style={{ color: '#D8FF4F' }}>Scientific Benchmark Interpretation:</strong><br />
            The official held-out test and grouped cross-protein evaluation answer related but different questions. ESM-2 achieves the lowest MAE on the single official test set, whereas the Experimental WT Contact Map achieves the strongest cross-protein grouped-CV performance. They should not be interpreted as a single universal ranking.
          </div>
        </div>
      </div>

      {/* 3. FROZEN BENCHMARK COMPARISON TABLE */}
      <div className="editorial-card-light" style={{ overflowX: 'auto' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 20px 0', color: '#11110F' }}>
          Complete 5-Paradigm Representation Benchmark Table
        </h2>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #D8D5CC', color: '#5a5852', background: '#ECEAE4' }}>
              <th style={{ padding: '12px 14px', fontWeight: 700 }}>Representation Paradigm</th>
              <th style={{ padding: '12px 14px', fontWeight: 700 }}>Dimensions / Arch</th>
              <th style={{ padding: '12px 14px', fontWeight: 700 }}>Test MAE</th>
              <th style={{ padding: '12px 14px', fontWeight: 700 }}>Test R²</th>
              <th style={{ padding: '12px 14px', fontWeight: 700 }}>Test Pearson r</th>
              <th style={{ padding: '12px 14px', fontWeight: 700 }}>Grouped CV MAE</th>
              <th style={{ padding: '12px 14px', fontWeight: 700 }}>Grouped CV R²</th>
              <th style={{ padding: '12px 14px', fontWeight: 700 }}>Grouped CV Pearson r</th>
            </tr>
          </thead>
          <tbody>
            {dataToUse.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #D8D5CC' }}>
                <td style={{ padding: '14px', fontWeight: 800, color: '#11110F' }}>{row.representation}</td>
                <td style={{ padding: '14px', color: '#5a5852', fontFamily: 'monospace' }}>{row.feature_or_architecture}</td>
                <td style={{ padding: '14px', fontWeight: 800, color: row.representation.includes('ESM') ? '#d97706' : '#11110F' }}>
                  {row.test_mae.toFixed(4)}
                </td>
                <td style={{ padding: '14px', color: '#5a5852' }}>{row.test_r2.toFixed(4)}</td>
                <td style={{ padding: '14px', color: '#5a5852' }}>{row.test_pearson.toFixed(4)}</td>
                <td style={{ padding: '14px', fontWeight: 800, color: row.representation.includes('Contact Map') ? '#10b981' : '#11110F' }}>
                  {row.grouped_cv_mae_mean.toFixed(4)} &plusmn; {row.grouped_cv_mae_std.toFixed(4)}
                </td>
                <td style={{ padding: '14px', color: '#5a5852' }}>{row.grouped_cv_r2_mean.toFixed(4)}</td>
                <td style={{ padding: '14px', fontWeight: 800, color: row.representation.includes('Contact Map') ? '#10b981' : '#5a5852' }}>
                  {row.grouped_cv_pearson_mean.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
