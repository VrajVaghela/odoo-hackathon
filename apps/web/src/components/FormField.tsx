import React from 'react';

interface FormFieldProps {
  label: string;
  id: string;
  error?: string;
  helpText?: string;
  unit?: string;
  required?: boolean;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  id,
  error,
  helpText,
  unit,
  required = false,
  children,
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-4)',
  };

  const labelContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    color: 'var(--color-text)',
  };

  const requiredStyle: React.CSSProperties = {
    color: 'var(--color-primary)',
    marginLeft: 'var(--space-1)',
  };

  const unitStyle: React.CSSProperties = {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    fontWeight: 500,
  };

  const helpStyle: React.CSSProperties = {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
  };

  const errorStyle: React.CSSProperties = {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-danger)',
    fontWeight: 500,
  };

  return (
    <div style={containerStyle}>
      <div style={labelContainerStyle}>
        <label htmlFor={id} style={labelStyle}>
          {label}
          {required && <span style={requiredStyle} aria-hidden="true">*</span>}
        </label>
        {unit && <span style={unitStyle}>{unit}</span>}
      </div>
      
      <div style={{ position: 'relative' }}>
        {children}
      </div>

      {error && (
        <span id={`${id}-error`} style={errorStyle} role="alert">
          {error}
        </span>
      )}
      {!error && helpText && (
        <span id={`${id}-help`} style={helpStyle}>
          {helpText}
        </span>
      )}
    </div>
  );
};
