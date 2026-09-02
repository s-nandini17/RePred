import React from 'react';
import { Layers, Dna, BarChart3, Database, Sparkles, ArrowRight, Monitor, BookOpen } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  presentationMode: boolean;
  onTogglePresentationMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  presentationMode,
  onTogglePresentationMode
}) => {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: presentationMode ? '#11110F' : 'rgba(251, 249, 245, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: presentationMode ? '1px solid #2A2925' : '1px solid #11110F',
        padding: '0 32px'
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Brand Header */}
        <div
          onClick={() => onTabChange('home')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '4px',
              background: '#11110F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              color: '#D8FF4F',
              fontSize: '1.15rem',
              fontFamily: 'monospace',
              border: '1px solid #11110F'
            }}
          >
            R
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  letterSpacing: '-0.03em',
                  color: presentationMode ? '#FBF9F5' : '#11110F',
                  lineHeight: 1.1
                }}
              >
                RepPred
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  color: '#11110F',
                  background: '#D8FF4F',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                  border: '1px solid #11110F'
                }}
              >
                Protein Benchmark
              </span>
            </div>
          </div>
        </div>

        {/* Minimal Architectural Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => onTabChange('home')}
            style={{
              padding: '8px 14px',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontWeight: 700,
              background: activeTab === 'home' ? (presentationMode ? '#2A2925' : '#11110F') : 'transparent',
              color: activeTab === 'home' ? '#D8FF4F' : (presentationMode ? '#a3a199' : '#52504a'),
              border: activeTab === 'home' ? '1px solid #11110F' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Story
          </button>

          <button
            onClick={() => onTabChange('explore')}
            style={{
              padding: '8px 14px',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontWeight: 700,
              background: activeTab === 'explore' ? (presentationMode ? '#2A2925' : '#11110F') : 'transparent',
              color: activeTab === 'explore' ? '#D8FF4F' : (presentationMode ? '#a3a199' : '#52504a'),
              border: activeTab === 'explore' ? '1px solid #11110F' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Explore
          </button>

          <button
            onClick={() => onTabChange('benchmark')}
            style={{
              padding: '8px 14px',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontWeight: 700,
              background: activeTab === 'benchmark' ? (presentationMode ? '#2A2925' : '#11110F') : 'transparent',
              color: activeTab === 'benchmark' ? '#D8FF4F' : (presentationMode ? '#a3a199' : '#52504a'),
              border: activeTab === 'benchmark' ? '1px solid #11110F' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Benchmark
          </button>

          <button
            onClick={() => onTabChange('interpretability')}
            style={{
              padding: '8px 14px',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontWeight: 700,
              background: activeTab === 'interpretability' ? (presentationMode ? '#2A2925' : '#11110F') : 'transparent',
              color: activeTab === 'interpretability' ? '#D8FF4F' : (presentationMode ? '#a3a199' : '#52504a'),
              border: activeTab === 'interpretability' ? '1px solid #11110F' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Interpretability
          </button>

          <button
            onClick={() => onTabChange('data')}
            style={{
              padding: '8px 14px',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontWeight: 700,
              background: activeTab === 'data' ? (presentationMode ? '#2A2925' : '#11110F') : 'transparent',
              color: activeTab === 'data' ? '#D8FF4F' : (presentationMode ? '#a3a199' : '#52504a'),
              border: activeTab === 'data' ? '1px solid #11110F' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Data
          </button>
        </nav>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onTogglePresentationMode}
            title="Toggle Presentation Mode"
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              background: presentationMode ? '#D8FF4F' : 'transparent',
              color: presentationMode ? '#11110F' : '#52504a',
              fontWeight: 700,
              fontSize: '0.75rem',
              border: presentationMode ? '1px solid #D8FF4F' : '1px solid #11110F',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Monitor size={14} /> {presentationMode ? 'Dark Theme' : 'Light Theme'}
          </button>

          <button
            onClick={() => onTabChange('explore')}
            className="btn-arch-black"
            style={{ padding: '8px 16px', fontSize: '0.825rem' }}
          >
            Explore a Mutation <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};
