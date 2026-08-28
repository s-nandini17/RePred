import React, { useState, useEffect } from 'react';
import { MutationRecord, DatasetSummary } from '../../types';
import { ApiService } from '../../services/api';
import { DistributionPlot } from './DistributionPlot';
import { MutationHeatmap } from './MutationHeatmap';
import { Badge } from '../common/Badge';
import { Search, ExternalLink, ArrowRight } from 'lucide-react';

interface DatasetExplorerProps {
  proteinId: string;
  datasets: DatasetSummary[];
  sequenceLength: number;
  onSelectMutationForPredict?: (mutationStr: string) => void;
}

export const DatasetExplorer: React.FC<DatasetExplorerProps> = ({
  proteinId,
  datasets,
  sequenceLength,
  onSelectMutationForPredict
}) => {
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(
    datasets[0]?.dataset_name || ''
  );
  const [mutations, setMutations] = useState<MutationRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [positionFilter, setPositionFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (datasets.length && !selectedDatasetId) {
      setSelectedDatasetId(datasets[0].dataset_name);
    }
  }, [datasets]);

  useEffect(() => {
    if (!proteinId) return;
    setLoading(true);

    ApiService.getMutations(proteinId, {
      dataset_id: selectedDatasetId || undefined,
      limit: 300
    })
      .then((res) => {
        setMutations(res.mutations);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load mutations:', err);
        setLoading(false);
      });
  }, [proteinId, selectedDatasetId]);

  const currentDataset = datasets.find((d) => d.dataset_name === selectedDatasetId) || datasets[0];

  const filteredMutations = mutations.filter((m) => {
    const matchesSearch = !searchTerm || m.mutation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPos = !positionFilter || String(m.position) === positionFilter;
    return matchesSearch && matchesPos;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div className="section-header">
        <div>
          <span className="hero-label">EXPERIMENTAL PROVENANCE</span>
          <h2 className="section-title">Deep Mutational Scanning Datasets</h2>
          <p className="section-subtitle">
            Authentic experimental fitness, stability, and binding measurements from ProteinGym and published literature.
          </p>
        </div>
      </div>

      {/* Dataset Selector Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {datasets.map((ds) => {
          const isSelected = (selectedDatasetId || datasets[0]?.dataset_name) === ds.dataset_name;
          return (
            <div
              key={ds.dataset_name}
              onClick={() => setSelectedDatasetId(ds.dataset_name)}
              className={isSelected ? 'panel-dark' : 'panel-light'}
              style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="mono" style={{ fontSize: '0.6875rem', color: isSelected ? 'var(--accent)' : 'var(--text-secondary)' }}>
                  {ds.source.toUpperCase()}
                </span>
                <Badge variant={isSelected ? 'accent' : 'neutral'}>{ds.assay_type}</Badge>
              </div>
              <h3 style={{ fontSize: '1.125rem', marginTop: '8px', marginBottom: '4px', color: isSelected ? 'var(--white)' : 'var(--text-primary)' }}>
                {ds.dataset_name}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: isSelected ? '#c5c3bc' : 'var(--text-secondary)', marginBottom: '12px' }}>
                {ds.measurement_type} ({ds.units})
              </p>
              <div className="mono" style={{ fontSize: '0.75rem', display: 'flex', gap: '16px', color: isSelected ? '#A8A69E' : 'var(--text-muted)' }}>
                <span>N = {ds.num_mutations} variants</span>
                {ds.pubmed_id && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    PMID:{ds.pubmed_id} <ExternalLink size={10} />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Visualizations Row */}
      {currentDataset && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          <DistributionPlot
            mutations={mutations}
            measurementType={currentDataset.measurement_type}
            units={currentDataset.units}
          />
          <MutationHeatmap
            mutations={mutations}
            sequenceLength={sequenceLength}
            onSelectMutation={onSelectMutationForPredict}
          />
        </div>
      )}

      {/* Mutation Table Section */}
      <div className="panel-light" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Table Controls */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              MUTATION ASSAYS ({filteredMutations.length} VARIANTS)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search mutation (e.g. M182T)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '30px', width: '220px', fontSize: '0.8125rem' }}
              />
            </div>
            <input
              type="number"
              placeholder="Position..."
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              style={{ width: '90px', fontSize: '0.8125rem' }}
            />
          </div>
        </div>

        {/* Table Body */}
        <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
          <table className="editorial-table">
            <thead>
              <tr>
                <th>Mutation</th>
                <th>WT</th>
                <th>Pos</th>
                <th>Mut</th>
                <th>Experimental Value</th>
                <th>Units</th>
                <th>Directionality</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredMutations.map((m) => (
                <tr key={m.mutation}>
                  <td className="mono" style={{ fontWeight: 600 }}>{m.mutation}</td>
                  <td className="mono">{m.wt_residue}</td>
                  <td className="mono">{m.position}</td>
                  <td className="mono">{m.mutant_residue}</td>
                  <td className="mono" style={{ fontWeight: 600 }}>
                    {m.measurement.toFixed(3)}
                  </td>
                  <td className="mono" style={{ color: 'var(--text-secondary)' }}>{m.units}</td>
                  <td>
                    <Badge variant={m.directionality.includes('higher') ? 'accent' : 'neutral'}>
                      {m.directionality}
                    </Badge>
                  </td>
                  <td>
                    {onSelectMutationForPredict && (
                      <button
                        onClick={() => onSelectMutationForPredict(m.mutation)}
                        className="btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.6875rem' }}
                      >
                        Predict in Lab <ArrowRight size={10} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
