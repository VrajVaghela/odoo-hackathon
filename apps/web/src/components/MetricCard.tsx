import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  helperText?: string;
  statusToken?: string; // e.g. '--color-success'
  loading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  helperText,
  statusToken = '--color-border',
  loading = false,
}) => {
  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-surface-raised)',
    border: '1px solid var(--color-border)',
    borderLeft: `4px solid var(${statusToken})`,
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-4)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
    boxShadow: 'var(--shadow-panel)',
    position: 'relative',
    overflow: 'hidden',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 'var(--text-xs)',
    textTransform: 'uppercase',
    color: 'var(--color-text-muted)',
    fontWeight: 600,
    letterSpacing: '0.05em',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: 'var(--text-2xl)',
    fontWeight: 700,
    color: 'var(--color-text)',
    lineHeight: 'var(--leading-tight)',
  };

  const helperStyle: React.CSSProperties = {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
  };

  if (loading) {
    return (
      <div style={cardStyle}>
        <div style={{ ...labelStyle, width: '40%', height: '12px', backgroundColor: 'var(--color-surface)', borderRadius: '2px' }} />
        <div style={{ ...valueStyle, width: '60%', height: '32px', backgroundColor: 'var(--color-surface)', borderRadius: '2px', margin: '4px 0' }} />
        <div style={{ ...helperStyle, width: '80%', height: '12px', backgroundColor: 'var(--color-surface)', borderRadius: '2px' }} />
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={labelStyle}>{label}</div>
      <div className="tabular-nums" style={valueStyle}>{value}</div>
      {helperText && <div style={helperStyle}>{helperText}</div>}
    </div>
  );
};
