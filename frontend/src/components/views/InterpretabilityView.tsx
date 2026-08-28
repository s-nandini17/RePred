import React from 'react';
import { FeatureImportanceItem } from '../../types/benchmark';
import { Layers, Dna, Box, Share2, Cpu, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';

interface InterpretabilityViewProps {
  featureImportanceData: Record<string, FeatureImportanceItem[]>;
}

export const InterpretabilityView: React.FC<InterpretabilityViewProps> = ({ featureImportanceData }) => {
  const seqFeatures = featureImportanceData['sequence'] || [];
  const structFeatures = featureImportanceData['3d'] || [];
  const contactFeatures = featureImportanceData['contact_map'] || [];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', color: '#11110F' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#11110F', background: '#D8FF4F', display: 'inline-block', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontFamily: 'monospace' }}>
          MODEL INTERPRETABILITY &amp; FEATURE RELIANCE
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 8px 0', color: '#11110F' }}>
          What is the model actually using?
        </h1>
        <p style={{ fontSize: '1rem', color: '#5a5852', margin: 0 }}>
          Quantifying feature importance across Sequence, Experimental WT 3D, and Contact Map representations.
        </p>
      </div>

      {/* SCIENTIFIC CAUTION WARNING BANNER */}
      <div
        style={{
          background: '#11110F',
          color: '#F8F7F2',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '36px',
          display: 'flex',
          gap: '14px',
          alignItems: 'flex-start'
        }}
      >
        <AlertTriangle size={22} color="#D8FF4F" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#D8FF4F', margin: '0 0 6px 0' }}>
            Predictive Reliance vs. Biological Causality
          </h4>
          <p style={{ fontSize: '0.85rem', color: '#a3a199', lineHeight: 1.5, margin: 0 }}>
            Feature importance represents predictive reliance within the fitted Machine Learning model, NOT direct biological causality. A high feature importance score indicates that the model relies heavily on that feature to predict FireProt $\Delta\Delta G$, not that the feature alone causes protein stability.
          </p>
        </div>
      </div>

      {/* THREE MAIN FEATURE IMPORTANCE SECTIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '28px', marginBottom: '40px' }}>
        {/* 1. Sequence Feature Importance */}
        <div className="editorial-card-light">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Dna size={20} color="#4f46e5" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#11110F', margin: 0 }}>Sequence (252D) Top Features</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {seqFeatures.slice(0, 10).map((f) => {
              const maxImp = seqFeatures[0]?.importance || 0.1;
              const pct = Math.min((f.importance / maxImp) * 100, 100);
              return (
                <div key={f.feature_name} style={{ background: '#ffffff', border: '1px solid #D8D5CC', padding: '10px 12px', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 800, color: '#11110F', marginBottom: '6px' }}>
                    <span>{f.rank}. {f.feature_name}</span>
                    <span style={{ color: '#4f46e5', fontFamily: 'monospace' }}>{f.importance.toFixed(4)}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#ECEAE4', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#4f46e5', borderRadius: '3px' }} />
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6F6D67', marginTop: '4px' }}>Group: {f.feature_group}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Experimental WT 3D Feature Importance */}
        <div className="editorial-card-light">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Box size={20} color="#10b981" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#11110F', margin: 0 }}>Experimental WT 3D Top Features</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {structFeatures.slice(0, 10).map((f) => {
              const maxImp = structFeatures[0]?.importance || 0.18;
              const pct = Math.min((f.importance / maxImp) * 100, 100);
              return (
                <div key={f.feature_name} style={{ background: '#ffffff', border: '1px solid #D8D5CC', padding: '10px 12px', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 800, color: '#11110F', marginBottom: '6px' }}>
                    <span>{f.rank}. {f.feature_name}</span>
                    <span style={{ color: '#10b981', fontFamily: 'monospace' }}>{f.importance.toFixed(4)}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#ECEAE4', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#10b981', borderRadius: '3px' }} />
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6F6D67', marginTop: '4px' }}>Group: {f.feature_group}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Contact Map Feature Importance */}
        <div className="editorial-card-light">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Share2 size={20} color="#e11d48" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#11110F', margin: 0 }}>Contact Map (107D) Top Features</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {contactFeatures.slice(0, 10).map((f) => {
              const maxImp = contactFeatures[0]?.importance || 0.18;
              const pct = Math.min((f.importance / maxImp) * 100, 100);
              return (
                <div key={f.feature_name} style={{ background: '#ffffff', border: '1px solid #D8D5CC', padding: '10px 12px', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 800, color: '#11110F', marginBottom: '6px' }}>
                    <span>{f.rank}. {f.feature_name}</span>
                    <span style={{ color: '#e11d48', fontFamily: 'monospace' }}>{f.importance.toFixed(4)}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#ECEAE4', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#e11d48', borderRadius: '3px' }} />
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6F6D67', marginTop: '4px' }}>Group: {f.feature_group}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ESM AND GNN EXPLAINABILITY CONSTRAINT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <div className="editorial-card-light">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Cpu size={20} color="#d97706" />
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#11110F', margin: 0 }}>ESM-2 Latent Feature Limitation</h4>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#5a5852', lineHeight: 1.5, margin: 0 }}>
            ESM-2 dimensions (1,280D) are learned latent features resulting from Transformer self-attention. Individual dimensions cannot be mapped to specific physical properties without external probe models.
          </p>
        </div>

        <div className="editorial-card-light">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Sparkles size={20} color="#9333ea" />
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#11110F', margin: 0 }}>Protein GNN Architecture Limitation</h4>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#5a5852', lineHeight: 1.5, margin: 0 }}>
            The Protein GNN learns representation dynamically via 3 EdgeConv message-passing layers over 58D node features and 3D edge attributes. Fixed-vector feature importance is not directly comparable to Random Forest models.
          </p>
        </div>
      </div>
    </div>
  );
};
