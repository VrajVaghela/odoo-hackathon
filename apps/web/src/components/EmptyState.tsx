import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📋',
  title,
  description,
  actionLabel,
  onAction,
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-10) var(--space-6)',
    textAlign: 'center',
    gap: 'var(--space-3)',
    backgroundColor: 'var(--color-surface-raised)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '2.5rem',
    opacity: 0.6,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 'var(--text-lg)',
    fontWeight: 700,
    color: 'var(--color-text)',
  };

  const descStyle: React.CSSProperties = {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
    maxWidth: '360px',
    lineHeight: 'var(--leading-normal)',
  };

  const buttonStyle: React.CSSProperties = {
    marginTop: 'var(--space-2)',
    height: 'var(--control-height)',
    padding: '0 var(--space-5)',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-primary-contrast)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-sm)',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  };

  return (
    <div style={containerStyle}>
      <span style={iconStyle} aria-hidden="true">{icon}</span>
      <div style={titleStyle}>{title}</div>
      {description && <div style={descStyle}>{description}</div>}
      {actionLabel && onAction && (
        <button
          type="button"
          style={buttonStyle}
          onClick={onAction}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-primary)'; }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
