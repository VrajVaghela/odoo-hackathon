import React from 'react';

interface ErrorAlertProps {
  message: string;
  code?: string;
  onDismiss?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, code, onDismiss }) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
    padding: 'var(--space-3) var(--space-4)',
    backgroundColor: 'rgba(233, 106, 106, 0.1)',
    border: '1px solid var(--color-danger)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-danger)',
    fontSize: 'var(--text-sm)',
    position: 'relative',
    marginBottom: 'var(--space-4)',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontWeight: 600,
  };

  const codeStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--text-xs)',
    opacity: 0.8,
  };

  const messageStyle: React.CSSProperties = {
    lineHeight: 'var(--leading-normal)',
  };

  const closeButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    padding: 'var(--space-1)',
    fontSize: 'var(--text-base)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div style={containerStyle} role="alert" aria-live="assertive">
      <div style={headerStyle}>
        <span>Error{code ? <> (<span style={codeStyle}>{code}</span>)</> : ''}</span>
        {onDismiss && (
          <button 
            type="button" 
            onClick={onDismiss} 
            style={closeButtonStyle}
            aria-label="Dismiss alert"
          >
            &times;
          </button>
        )}
      </div>
      <div style={messageStyle}>{message}</div>
    </div>
  );
};
