import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions }) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 'var(--space-4)',
    marginBottom: 'var(--space-6)',
  };

  const textStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
    minWidth: 0,
    flex: 1,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 'var(--text-xl)',
    fontWeight: 800,
    color: 'var(--color-text)',
    lineHeight: 'var(--leading-tight)',
    margin: 0,
  };

  const descStyle: React.CSSProperties = {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
    margin: 0,
  };

  return (
    <div style={containerStyle}>
      <div style={textStyle}>
        <h2 style={titleStyle}>{title}</h2>
        {description && <p style={descStyle}>{description}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 'var(--space-3)', flexShrink: 0 }}>{actions}</div>}
    </div>
  );
};
