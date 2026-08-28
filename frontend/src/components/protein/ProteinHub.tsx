import React, { useState, useEffect } from 'react';
import { ProteinDetails, StructureData } from '../../types';
import { ApiService } from '../../services/api';
import { SequenceViewer } from './SequenceViewer';
import { Structure3DViewer } from '../representations/Structure3DViewer';
import { Badge } from '../common/Badge';
import { ExternalLink, ArrowRight, RefreshCw } from 'lucide-react';

interface ProteinHubProps {
  proteinId: string;
  onNavigateToDataset: () => void;
  onNavigateToBenchmark: () => void;
}

export const ProteinHub: React.FC<ProteinHubProps> = ({
  proteinId,
  onNavigateToDataset,
  onNavigateToBenchmark
}) => {
  const [details, setDetails] = useState<ProteinDetails | null>(null);
  const [structure, setStructure] = useState<StructureData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPos, setSelectedPos] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      ApiService.getProteinDetails(proteinId),
      ApiService.getProteinStructure(proteinId)
    ])
      .then(([det, struct]) => {
        setDetails(det);
        setStructure(struct);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load protein hub:', err);
        setLoading(false);
      });
  }, [proteinId]);

  if (loading) {
    return (
      <div className="panel-light" style={{ padding: '60px', textAlign: 'center' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--text-muted)' }} />
        <div className="mono" style={{ fontSize: '0.875rem' }}>Loading Protein Architecture...</div>
      </div>
    );
  }

  if (!details) return null;

  const totalMutCount = details.datasets.reduce((acc, d) => acc + (d.num_mutations || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
      {/* Section Header */}
      <div className="section-header">
        <div>
          <span className="hero-label">TARGET MACROMOLECULE</span>
          <h2 className="section-title">{details.metadata.name}</h2>
          <p className="section-subtitle">
            {details.metadata.organism} &bull; UniProt: {details.metadata.uniprot_id} &bull; PDB: {details.metadata.pdb_id} &bull; {details.metadata.length} Amino Acids
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onNavigateToBenchmark} className="btn-primary">
            Explore Benchmark <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Overview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="panel-light">
          <span className="hero-label">BIOLOGICAL FUNCTION</span>
          <h4 style={{ fontSize: '1.125rem', marginTop: '2px' }}>{details.metadata.function}</h4>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {details.metadata.organism} {details.metadata.ec_number ? `(EC: ${details.metadata.ec_number})` : ''}
          </p>
        </div>

        <div className="panel-light">
          <span className="hero-label">EXPERIMENTAL STRUCTURE</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <span className="mono" style={{ fontSize: '1.125rem', fontWeight: 600 }}>PDB: {details.metadata.pdb_id}</span>
            <Badge variant="accent">{structure?.resolution}</Badge>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Chain {structure?.chain || 'A'} &bull; Mean B-Factor: {structure?.mean_b_factor.toFixed(1)} Å²
          </p>
        </div>

        <div className="panel-light">
          <span className="hero-label">CURATED ASSAYS</span>
          <h4 style={{ fontSize: '1.125rem', marginTop: '2px' }}>{details.datasets.length} Experimental Assays</h4>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Total {totalMutCount} curated mutation measurements
          </p>
        </div>

        <div className="panel-light">
          <span className="hero-label">EXTERNAL REPOSITORIES</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
            <a
              href={`https://www.uniprot.org/uniprotkb/${details.metadata.uniprot_id}`}
              target="_blank"
              rel="noreferrer"
              className="mono"
              style={{ fontSize: '0.75rem', color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              UniProtKB:{details.metadata.uniprot_id} <ExternalLink size={11} />
            </a>
            <a
              href={`https://www.rcsb.org/structure/${details.metadata.pdb_id}`}
              target="_blank"
              rel="noreferrer"
              className="mono"
              style={{ fontSize: '0.75rem', color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              RCSB PDB:{details.metadata.pdb_id} <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </div>

      {/* 3D Structure and Primary Sequence */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <Structure3DViewer structure={structure} highlightPosition={selectedPos} />
        <SequenceViewer
          sequence={structure?.sequence || ''}
          rsa={structure?.rsa}
          secondaryStructure={structure?.secondary_structure}
          selectedPosition={selectedPos}
          onSelectPosition={setSelectedPos}
        />
      </div>

      {/* Available Experimental Datasets */}
      <div className="panel-light">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <div>
            <span className="hero-label">DEEP MUTATIONAL SCANNING</span>
            <h3 style={{ fontSize: '1.25rem', marginTop: '2px' }}>Curated Experimental Datasets</h3>
          </div>
          <button onClick={onNavigateToDataset} className="btn-secondary">
            Open Dataset Explorer <ArrowRight size={12} />
          </button>
        </div>

        <table className="editorial-table">
          <thead>
            <tr>
              <th>Dataset / Assay Name</th>
              <th>Source</th>
              <th>Task / Assay Type</th>
              <th>Measurement</th>
              <th>Units</th>
              <th>Variants</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {details.datasets.map((ds) => (
              <tr key={ds.dataset_name}>
                <td className="mono" style={{ fontWeight: 600 }}>{ds.dataset_name}</td>
                <td><Badge variant="neutral">{ds.source.toUpperCase()}</Badge></td>
                <td style={{ textTransform: 'capitalize' }}>{ds.assay_type}</td>
                <td>{ds.measurement_type}</td>
                <td className="mono">{ds.units}</td>
                <td className="mono">{ds.num_mutations}</td>
                <td className="mono" style={{ fontSize: '0.75rem' }}>
                  {ds.pubmed_id ? (
                    <a
                      href={`https://pubmed.ncbi.nlm.nih.gov/${ds.pubmed_id}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      PMID:{ds.pubmed_id} <ExternalLink size={10} />
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
