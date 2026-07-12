import React, { useState } from 'react';
import { FormField } from '../../components/FormField.tsx';
import { ErrorAlert } from '../../components/ErrorAlert.tsx';

interface LoginFormProps {
  onLoginSuccess: (user: { email: string; role: string }) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState<{ message: string; code?: string } | null>(null);

  const demoAccounts = [
    { label: 'Fleet Manager', email: 'manager@transitops.com', role: 'FLEET_MANAGER' },
    { label: 'Dispatcher', email: 'dispatcher@transitops.com', role: 'DISPATCHER' },
    { label: 'Safety Officer', email: 'safety@transitops.com', role: 'SAFETY_OFFICER' },
    { label: 'Financial Analyst', email: 'finance@transitops.com', role: 'FINANCIAL_ANALYST' },
  ];

  const handleQuickSelect = (acc: typeof demoAccounts[0]) => {
    setEmail(acc.email);
    setPassword('password123');
    setErrors({});
    setApiError(null);
  };

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) return;

    setPending(true);

    try {
      // API call to auth login
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || 'Invalid email or password');
      }

      const data = await response.json();
      onLoginSuccess(data.user);
    } catch (err: any) {
      setApiError({
        message: err.message || 'An error occurred during login. Please try again.',
        code: 'LOGIN_FAILED',
      });
    } finally {
      setPending(false);
    }
  };

  // Styles
  const containerStyle: React.CSSProperties = {
    maxWidth: '440px',
    width: '100%',
    backgroundColor: 'var(--color-surface-raised)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
    boxShadow: 'var(--shadow-panel)',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 'var(--text-xl)',
    fontWeight: 700,
    color: 'var(--color-text)',
    marginBottom: 'var(--space-1)',
    textAlign: 'center',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    marginBottom: 'var(--space-6)',
    textAlign: 'center',
  };

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%',
    height: 'var(--control-height)',
    backgroundColor: 'var(--color-surface)',
    border: `1px solid ${hasError ? 'var(--color-danger)' : 'var(--color-border)'}`,
    borderRadius: 'var(--radius-sm)',
    padding: '0 var(--space-4)',
    color: 'var(--color-text)',
    fontSize: 'var(--text-sm)',
    outline: 'none',
  });

  const passwordWrapperStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  };

  const toggleButtonStyle: React.CSSProperties = {
    position: 'absolute',
    right: 'var(--space-3)',
    background: 'none',
    border: 'none',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    height: 'var(--control-height)',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-primary-contrast)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-sm)',
    fontWeight: 700,
    cursor: pending ? 'not-allowed' : 'pointer',
    marginTop: 'var(--space-2)',
    transition: 'background-color 0.2s',
  };

  const quickSelectContainerStyle: React.CSSProperties = {
    marginTop: 'var(--space-6)',
    borderTop: '1px solid var(--color-border)',
    paddingTop: 'var(--space-4)',
  };

  const quickSelectLabelStyle: React.CSSProperties = {
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    marginBottom: 'var(--space-3)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-2)',
  };

  const quickSelectButtonStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
    padding: 'var(--space-2)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-xs)',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    transition: 'background-color 0.2s',
  };

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>TransitOps</h2>
      <p style={subtitleStyle}>Fleet Control Command Center</p>

      {apiError && (
        <ErrorAlert 
          message={apiError.message} 
          code={apiError.code} 
          onDismiss={() => setApiError(null)} 
        />
      )}

      <form onSubmit={handleSubmit} noValidate>
        <FormField label="Email Address" id="email" error={errors.email} required>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            placeholder="dispatcher@transitops.com"
            style={inputStyle(!!errors.email)}
            disabled={pending}
          />
        </FormField>

        <FormField label="Password" id="password" error={errors.password} required>
          <div style={passwordWrapperStyle}>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              placeholder="••••••••"
              style={inputStyle(!!errors.password)}
              disabled={pending}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={toggleButtonStyle}
              tabIndex={-1}
            >
              {showPassword ? 'HIDE' : 'SHOW'}
            </button>
          </div>
        </FormField>

        <button type="submit" style={buttonStyle} disabled={pending}>
          {pending ? 'SIGNING IN...' : 'SIGN IN'}
        </button>
      </form>

      <div style={quickSelectContainerStyle}>
        <div style={quickSelectLabelStyle}>Quick Demo Accounts</div>
        <div style={gridStyle}>
          {demoAccounts.map((acc) => (
            <button
              key={acc.role}
              type="button"
              onClick={() => handleQuickSelect(acc)}
              style={quickSelectButtonStyle}
              disabled={pending}
            >
              <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{acc.label}</span>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{acc.email}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
