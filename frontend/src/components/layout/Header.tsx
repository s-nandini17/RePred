import React from 'react';
import { ProteinSummary } from '../../types';
import { ChevronDown } from 'lucide-react';

interface HeaderProps {
  proteins: ProteinSummary[];
  selectedProteinId: string;
  onSelectProtein: (id: string) => void;
  selectedTaskId: string;
  onSelectTask: (taskId: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  availableTasks: string[];
}

export const Header: React.FC<HeaderProps> = ({
  proteins,
  selectedProteinId,
  onSelectProtein,
  selectedTaskId,
  onSelectTask,
  activeTab,
  onTabChange,
  availableTasks
}) => {
  const tabs = [
    { id: 'protein', label: '1. Protein Hub' },
    { id: 'dataset', label: '2. Dataset Explorer' },
    { id: 'representations', label: '3. Representations' },
    { id: 'prediction', label: '4. Prediction Lab' },
    { id: 'benchmark', label: '5. Benchmark' },
    { id: 'compare', label: '6. Compare & Perfect Check' }
  ];

  return (
    <header className="navbar-container">
      {/* Top Brand & Selectors Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 32px',
          borderBottom: '1px solid var(--border)'
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              background: 'var(--surface-dark)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              borderRadius: '2px'
            }}
          >
            Ψ
          </div>
          <div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              PROTEIN BENCH
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px', fontFamily: 'var(--font-mono)' }}>
              v1.0
            </span>
          </div>
        </div>

        {/* Global Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Target Protein */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              PROTEIN:
            </span>
            <div style={{ position: 'relative' }}>
              <select
                id="protein-selector"
                value={selectedProteinId}
                onChange={(e) => onSelectProtein(e.target.value)}
                style={{
                  minWidth: '220px',
                  fontWeight: 500,
                  fontSize: '0.8125rem',
                  paddingRight: '32px',
                  cursor: 'pointer'
                }}
              >
                {proteins.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.pdb_id})
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                style={{ position: 'absolute', right: '10px', top: '12px', pointerEvents: 'none', color: 'var(--text-muted)' }}
              />
            </div>
          </div>

          {/* Design Task */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              TASK:
            </span>
            <div style={{ position: 'relative' }}>
              <select
                id="task-selector"
                value={selectedTaskId}
                onChange={(e) => onSelectTask(e.target.value)}
                style={{
                  minWidth: '210px',
                  fontWeight: 500,
                  fontSize: '0.8125rem',
                  paddingRight: '32px',
                  cursor: 'pointer'
                }}
              >
                {availableTasks.includes('stability') && (
                  <option value="stability">Stability (ΔΔG / Proteolysis)</option>
                )}
                {availableTasks.includes('binding') && (
                  <option value="binding">Binding Affinity (IgG-Fc)</option>
                )}
                {availableTasks.includes('functional_fitness') && (
                  <option value="functional_fitness">Functional Fitness / Activity</option>
                )}
                {availableTasks.length === 0 && (
                  <option value="stability">Stability Prediction</option>
                )}
              </select>
              <ChevronDown
                size={14}
                style={{ position: 'absolute', right: '10px', top: '12px', pointerEvents: 'none', color: 'var(--text-muted)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '2px',
          padding: '0 32px',
          overflowX: 'auto'
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-dot" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
