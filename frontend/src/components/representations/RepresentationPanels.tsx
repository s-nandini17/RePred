import React from 'react';
import { MutationItem } from '../../types/benchmark';
import { Layers, Dna, Cpu, Box, Share2, AlertCircle, Info, Sparkles, CheckCircle2 } from 'lucide-react';

interface PanelProps {
  mutation: MutationItem;
  featureData?: Record<string, any>;
}

// 1. Sequence Representation Panel (252D)
export const SequencePanel: React.FC<PanelProps> = ({ mutation }) => {
  return (
    <div style={{ background: '#11110F', border: '1px solid #2A2925', borderRadius: '8px', padding: '24px', color: '#F8F7F2' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <Dna size={20} color="#D8FF4F" />
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#F8F7F2', margin: 0 }}>Hand-Engineered Sequence Representation</h3>
          <span style={{ fontSize: '0.75rem', color: '#D8FF4F', fontWeight: 700, fontFamily: 'monospace' }}>252 Dimensions &bull; Source: combined_fireprot.csv</span>
        </div>
      </div>

      <p style={{ fontSize: '0.85rem', color: '#a3a199', lineHeight: 1.5, marginBottom: '20px' }}>
        Combines wild-type and mutant residue one-hot vectors (40D), BLOSUM62 substitution matrix score, physicochemical property deltas (9D), position relative to sequence length (3D), and local flanking sequence context (200D).
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div style={{ background: '#1c1b18', padding: '12px 14px', borderRadius: '6px', border: '1px solid #2A2925' }}>
          <div style={{ fontSize: '0.7rem', color: '#a3a199', textTransform: 'uppercase', fontWeight: 700 }}>Mutation Substitution</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#D8FF4F', marginTop: '4px' }}>{mutation.wt_aa} → {mutation.mut_aa}</div>
          <div style={{ fontSize: '0.75rem', color: '#a3a199', marginTop: '2px' }}>Pos: {mutation.position} / {mutation.sequence ? mutation.sequence.length : 'N/A'}</div>
        </div>

        <div style={{ background: '#1c1b18', padding: '12px 14px', borderRadius: '6px', border: '1px solid #2A2925' }}>
          <div style={{ fontSize: '0.7rem', color: '#a3a199', textTransform: 'uppercase', fontWeight: 700 }}>Relative Position</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F8F7F2', marginTop: '4px' }}>
            {mutation.sequence ? (mutation.position / mutation.sequence.length).toFixed(4) : 'N/A'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#a3a199', marginTop: '2px' }}>Normalized Sequence Pos</div>
        </div>

        <div style={{ background: '#1c1b18', padding: '12px 14px', borderRadius: '6px', border: '1px solid #2A2925' }}>
          <div style={{ fontSize: '0.7rem', color: '#a3a199', textTransform: 'uppercase', fontWeight: 700 }}>Flanking Context Window</div>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
            {mutation.sequence && mutation.position > 5
              ? mutation.sequence.substring(mutation.position - 6, mutation.position + 5)
              : 'Context Active (k=5)'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#a3a199', marginTop: '2px' }}>5 Left + 5 Right AAs (200D)</div>
        </div>
      </div>
    </div>
  );
};

// 2. ESM-2 Learned Representation Panel (1280D)
export const ESMPanel: React.FC<PanelProps> = ({ mutation }) => {
  return (
    <div style={{ background: '#11110F', border: '1px solid #2A2925', borderRadius: '8px', padding: '24px', color: '#F8F7F2' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <Cpu size={20} color="#D8FF4F" />
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#F8F7F2', margin: 0 }}>ESM-2 8M Learned Representation</h3>
          <span style={{ fontSize: '0.75rem', color: '#D8FF4F', fontWeight: 700, fontFamily: 'monospace' }}>1280 Dimensions &bull; Source: esm_embeddings_8m.pt</span>
        </div>
      </div>

      <p style={{ fontSize: '0.85rem', color: '#a3a199', lineHeight: 1.5, marginBottom: '20px' }}>
        Extracted directly from the ESM-2 8M Transformer model (`esm2_t6_8M_UR50D`) by computing mean-pooled protein sequence embeddings on real FireProt wild-type sequences.
      </p>

      <div style={{ background: '#1c1b18', border: '1px solid #2A2925', borderRadius: '6px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <Info size={18} color="#D8FF4F" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.825rem', color: '#F8F7F2', lineHeight: 1.5 }}>
          <strong style={{ color: '#D8FF4F' }}>Learned Latent Representation Notice:</strong><br />
          ESM-2 dimensions are learned 1280-dimensional latent features resulting from self-attention pre-training. Individual embedding dimensions are not assigned fixed human-readable biological labels in this benchmark prototype.
        </div>
      </div>
    </div>
  );
};

// 3. Experimental WT 3D Panel (131D)
export const StructurePanel: React.FC<PanelProps> = ({ mutation, featureData }) => {
  return (
    <div style={{ background: '#11110F', border: '1px solid #2A2925', borderRadius: '8px', padding: '24px', color: '#F8F7F2' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <Box size={20} color="#10b981" />
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#F8F7F2', margin: 0 }}>Experimental WT 3D Representation</h3>
          <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, fontFamily: 'monospace' }}>131 Dimensions &bull; Source: structural_features.csv (100 PDBs)</span>
        </div>
      </div>

      <p style={{ fontSize: '0.85rem', color: '#a3a199', lineHeight: 1.5, marginBottom: '20px' }}>
        Derived strictly from real experimental wild-type PDB coordinates. Measures local spatial mass density, packing density within 10 Å, Cα B-factor, backbone dihedral angles (phi, psi), distance to center of mass, and 5 nearest spatial neighbor distances.
      </p>

      {featureData ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <div style={{ background: '#1c1b18', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.7rem', color: '#a3a199' }}>Local Mass Density (10Å)</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
              {typeof featureData.loc_mol_weight_10A === 'number' ? featureData.loc_mol_weight_10A.toFixed(2) : 'Active'} Da
            </div>
          </div>
          <div style={{ background: '#1c1b18', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.7rem', color: '#a3a199' }}>Cα B-Factor</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#D8FF4F', marginTop: '4px' }}>
              {typeof featureData.Calpha_B_factor === 'number' ? featureData.Calpha_B_factor.toFixed(2) : 'Active'}
            </div>
          </div>
          <div style={{ background: '#1c1b18', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.7rem', color: '#a3a199' }}>Dist to Protein COM</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F8F7F2', marginTop: '4px' }}>
              {typeof featureData.dist_protein_COM_A === 'number' ? featureData.dist_protein_COM_A.toFixed(2) : 'Active'} Å
            </div>
          </div>
          <div style={{ background: '#1c1b18', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.7rem', color: '#a3a199' }}>Nearest Neighbor 1 Dist</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F8F7F2', marginTop: '4px' }}>
              {typeof featureData.nearest_neighbor_1_dist_A === 'number' ? featureData.nearest_neighbor_1_dist_A.toFixed(2) : 'Active'} Å
            </div>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '0.8rem', color: '#a3a199', fontStyle: 'italic' }}>Real 131D structural feature metrics active for mutation {mutation.mutation}</div>
      )}
    </div>
  );
};

// 4. Experimental WT Contact Map Panel (107D)
export const ContactMapPanel: React.FC<PanelProps> = ({ mutation, featureData }) => {
  return (
    <div style={{ background: '#11110F', border: '1px solid #2A2925', borderRadius: '8px', padding: '24px', color: '#F8F7F2' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <Share2 size={20} color="#e11d48" />
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#F8F7F2', margin: 0 }}>Experimental WT Contact Map Representation</h3>
          <span style={{ fontSize: '0.75rem', color: '#e11d48', fontWeight: 700, fontFamily: 'monospace' }}>107 Dimensions &bull; Primary Contact Definition: Cα–Cα ≤ 8.0 Å</span>
        </div>
      </div>

      <p style={{ fontSize: '0.85rem', color: '#a3a199', lineHeight: 1.5, marginBottom: '20px' }}>
        Captures explicit residue-residue spatial connectivity from experimental WT PDBs. Includes 8 Å and 10 Å contact counts, contact density, sequence separation statistics (short/medium/long range), and contacted amino-acid composition.
      </p>

      {featureData ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <div style={{ background: '#1c1b18', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.7rem', color: '#a3a199' }}>10Å Contact Count</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#e11d48', marginTop: '4px' }}>
              {featureData.contact_count_10A || 'Active'} contacts
            </div>
          </div>
          <div style={{ background: '#1c1b18', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.7rem', color: '#a3a199' }}>8Å Local Contact Density</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#D8FF4F', marginTop: '4px' }}>
              {typeof featureData.local_contact_density_8A === 'number' ? featureData.local_contact_density_8A.toFixed(3) : 'Active'}
            </div>
          </div>
          <div style={{ background: '#1c1b18', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.7rem', color: '#a3a199' }}>Mean Seq Separation</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F8F7F2', marginTop: '4px' }}>
              {typeof featureData.mean_seq_separation_8A === 'number' ? featureData.mean_seq_separation_8A.toFixed(1) : 'Active'} residues
            </div>
          </div>
          <div style={{ background: '#1c1b18', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.7rem', color: '#a3a199' }}>Contact Mean Mass</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F8F7F2', marginTop: '4px' }}>
              {typeof featureData.contact_mean_mol_weight === 'number' ? featureData.contact_mean_mol_weight.toFixed(1) : 'Active'} Da
            </div>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '0.8rem', color: '#a3a199', fontStyle: 'italic' }}>Real 107D contact map feature metrics active for mutation {mutation.mutation}</div>
      )}
    </div>
  );
};

// 5. Experimental WT Protein Graph GNN Panel
export const GNNPanel: React.FC<PanelProps> = ({ mutation }) => {
  return (
    <div style={{ background: '#11110F', border: '1px solid #2A2925', borderRadius: '8px', padding: '24px', color: '#F8F7F2' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <Sparkles size={20} color="#9333ea" />
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#F8F7F2', margin: 0 }}>Experimental WT Protein Graph &bull; GNN</h3>
          <span style={{ fontSize: '0.75rem', color: '#D8FF4F', fontWeight: 700, fontFamily: 'monospace' }}>3-Layer EdgeConv Architecture &bull; 58D Node / 3D Edge Features</span>
        </div>
      </div>

      <p style={{ fontSize: '0.85rem', color: '#a3a199', lineHeight: 1.5, marginBottom: '20px' }}>
        Learns spatial representations directly from raw molecular graph topologies constructed from experimental WT PDBs (Cα–Cα ≤ 8.0 Å). Uses 3 EdgeConv message-passing layers (58D → 64D) and mutation-centered readout.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div style={{ background: '#1c1b18', padding: '12px', borderRadius: '6px', border: '1px solid #2A2925' }}>
          <div style={{ fontSize: '0.7rem', color: '#a3a199', textTransform: 'uppercase', fontWeight: 700 }}>Node Input (58D)</div>
          <div style={{ fontSize: '0.85rem', color: '#F8F7F2', marginTop: '4px' }}>
            20D WT + 20D MUT + 1D Pos + 1D B-factor + 5D Phys + 5D Dihedrals + 1D Mut-site + 5D Deltas
          </div>
        </div>

        <div style={{ background: '#1c1b18', padding: '12px', borderRadius: '6px', border: '1px solid #2A2925' }}>
          <div style={{ fontSize: '0.7rem', color: '#a3a199', textTransform: 'uppercase', fontWeight: 700 }}>Edge Attributes (3D)</div>
          <div style={{ fontSize: '0.85rem', color: '#F8F7F2', marginTop: '4px' }}>
            Cα–Cα distance d ≤ 8.0 Å, sequence separation |i-j|, normalized separation
          </div>
        </div>

        <div style={{ background: '#1c1b18', padding: '12px', borderRadius: '6px', border: '1px solid #2A2925' }}>
          <div style={{ fontSize: '0.7rem', color: '#a3a199', textTransform: 'uppercase', fontWeight: 700 }}>Message Passing &amp; Readout</div>
          <div style={{ fontSize: '0.85rem', color: '#D8FF4F', fontWeight: 700, marginTop: '4px' }}>
            3 EdgeConv Layers (64D) → h_mut in R^64 + 5D deltas → 69D → 32D → 1D
          </div>
        </div>
      </div>
    </div>
  );
};
