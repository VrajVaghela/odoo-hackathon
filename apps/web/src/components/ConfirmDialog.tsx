import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
  pending = false,
}) => {
  if (!isOpen) return null;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 'var(--space-4)',
  };

  const dialogStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-surface-raised)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    maxWidth: '400px',
    width: '100%',
    boxShadow: 'var(--shadow-panel)',
    overflow: 'hidden',
  };

  const contentStyle: React.CSSProperties = {
    padding: 'var(--space-5)',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 'var(--text-lg)',
    fontWeight: 700,
    color: 'var(--color-text)',
    marginBottom: 'var(--space-2)',
  };

  const messageStyle: React.CSSProperties = {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
    lineHeight: 'var(--leading-normal)',
  };

  const footerStyle: React.CSSProperties = {
    padding: 'var(--space-4) var(--space-5)',
    backgroundColor: 'var(--color-surface)',
    borderTop: '1px solid var(--color-border)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 'var(--space-3)',
  };

  const buttonBaseStyle: React.CSSProperties = {
    height: 'var(--control-height)',
    minWidth: '100px',
    padding: '0 var(--space-4)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
  };

  const cancelButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    background: 'none',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
  };

  const confirmButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: isDestructive ? 'var(--color-danger)' : 'var(--color-primary)',
    border: 'none',
    color: isDestructive ? 'var(--color-text)' : 'var(--color-primary-contrast)',
  };

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div style={dialogStyle}>
        <div style={contentStyle}>
          <h2 id="dialog-title" style={titleStyle}>{title}</h2>
          <p style={messageStyle}>{message}</p>
        </div>
        <div style={footerStyle}>
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            style={cancelButtonStyle}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            style={confirmButtonStyle}
          >
            {pending ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
