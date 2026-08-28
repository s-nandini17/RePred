import React from 'react';
import { AlertCircle, Info, ShieldCheck } from 'lucide-react';

interface AlertBannerProps {
  type?: 'info' | 'warning' | 'success' | 'integrity';
  title?: string;
  message: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type = 'info',
  title,
  message
}) => {
  const isDark = type === 'integrity';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        padding: '14px 18px',
        borderRadius: '2px',
        border: isDark ? '1px solid var(--border-dark)' : '1px solid var(--border)',
        backgroundColor: isDark ? 'var(--surface-dark)' : 'var(--surface)',
        color: isDark ? 'var(--white)' : 'var(--text-primary)',
        fontSize: '0.8125rem',
        lineHeight: '1.5'
      }}
    >
      <div style={{ flexShrink: 0, marginTop: '2px', color: isDark ? 'var(--accent)' : 'var(--text-secondary)' }}>
        {type === 'integrity' ? <ShieldCheck size={16} /> : type === 'warning' ? <AlertCircle size={16} /> : <Info size={16} />}
      </div>
      <div>
        {title && (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: isDark ? 'var(--accent)' : 'var(--text-primary)',
              marginBottom: '2px'
            }}
          >
            {title}
          </div>
        )}
        <div style={{ color: isDark ? '#c5c3bc' : 'var(--text-secondary)' }}>
          {message}
        </div>
      </div>
    </div>
  );
};
