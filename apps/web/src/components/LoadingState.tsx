import React from 'react';

interface LoadingStateProps {
  rows?: number;
  variant?: 'table' | 'cards' | 'kpi';
}

export const LoadingState: React.FC<LoadingStateProps> = ({ rows = 5, variant = 'table' }) => {
  const shimmer: React.CSSProperties = {
    background: 'linear-gradient(90deg, var(--color-surface) 25%, var(--color-surface-hover) 50%, var(--color-surface) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: 'var(--radius-sm)',
  };

  if (variant === 'kpi') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 12rem), 1fr))', gap: 'var(--space-4)' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{
            backgroundColor: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}>
            <div style={{ ...shimmer, width: '50%', height: '12px' }} />
            <div style={{ ...shimmer, width: '40%', height: '32px' }} />
            <div style={{ ...shimmer, width: '70%', height: '12px' }} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{
            backgroundColor: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}>
            <div style={{ ...shimmer, width: '60%', height: '14px' }} />
            <div style={{ ...shimmer, width: '40%', height: '12px' }} />
            <div style={{ ...shimmer, width: '30%', height: '20px' }} />
          </div>
        ))}
      </div>
    );
  }

  // Table variant
  return (
    <div style={{
      backgroundColor: 'var(--color-surface-raised)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      {/* Header skeleton */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-4)',
        padding: 'var(--space-3) var(--space-4)',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
      }}>
        {[25, 20, 15, 15, 10, 15].map((w, i) => (
          <div key={i} style={{ ...shimmer, width: `${w}%`, height: '12px' }} />
        ))}
      </div>
      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          display: 'flex',
          gap: 'var(--space-4)',
          padding: 'var(--space-3) var(--space-4)',
          borderBottom: i < rows - 1 ? '1px solid var(--color-border)' : 'none',
        }}>
          {[25, 20, 15, 15, 10, 15].map((w, j) => (
            <div key={j} style={{ ...shimmer, width: `${w}%`, height: '14px' }} />
          ))}
        </div>
      ))}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};
