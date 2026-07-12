import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/PageHeader.tsx';
import { FormField } from '../../components/FormField.tsx';
import { ErrorAlert } from '../../components/ErrorAlert.tsx';

interface Role {
  id: number;
  code: string;
  label: string;
}

interface Invitation {
  id: number;
  email: string;
  role_label: string;
  role_code: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
}

export const UsersPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [apiError, setApiError] = useState<{ message: string; code?: string } | null>(null);

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/v1/users/roles');
      if (res.ok) {
        const data = await res.json();
        setRoles(data.data || []);
      }
    } catch { /* ignore */ }
  };

  const fetchInvitations = async () => {
    try {
      const res = await fetch('/api/v1/users/invitations');
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.data || []);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchRoles();
    fetchInvitations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setSuccess(null);

    if (!email.trim()) {
      setApiError({ message: 'Email is required.', code: 'VALIDATION_ERROR' });
      return;
    }
    if (!roleId) {
      setApiError({ message: 'Please select a role.', code: 'VALIDATION_ERROR' });
      return;
    }

    setPending(true);
    try {
      const res = await fetch('/api/v1/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role_id: Number(roleId) }),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError({
          message: data?.error?.message || 'Failed to send invitation.',
          code: data?.error?.code,
        });
        return;
      }

      setSuccess(`Invitation sent to ${email.trim()} as ${data.data?.role || 'team member'}`);
      setEmail('');
      setRoleId('');
      fetchInvitations();
    } catch (err: any) {
      setApiError({ message: err.message || 'Network error.' });
    } finally {
      setPending(false);
    }
  };

  const getStatus = (inv: Invitation): { label: string; color: string } => {
    if (inv.accepted_at) {
      return { label: 'Accepted', color: 'var(--color-success)' };
    }
    const isExpired = new Date(inv.expires_at).getTime() < Date.now();
    if (isExpired) {
      return { label: 'Expired', color: 'var(--color-danger)' };
    }
    return { label: 'Pending', color: 'var(--color-warning)' };
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // Styles
  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-6)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 'var(--control-height)',
    padding: '0 var(--space-3)',
    backgroundColor: 'var(--color-canvas)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--color-text)',
    fontSize: 'var(--text-sm)',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
    backgroundPosition: 'right 8px center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '16px',
    paddingRight: 'var(--space-8)',
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
    opacity: pending ? 0.7 : 1,
    transition: 'background-color 0.2s, opacity 0.2s',
  };

  const successStyle: React.CSSProperties = {
    padding: 'var(--space-3) var(--space-4)',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--color-success)',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
  };

  const thStyle: React.CSSProperties = {
    padding: 'var(--space-3) var(--space-4)',
    textAlign: 'left' as const,
    fontSize: 'var(--text-xs)',
    fontWeight: 700,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    borderBottom: '2px solid var(--color-border)',
  };

  const tdStyle: React.CSSProperties = {
    padding: 'var(--space-3) var(--space-4)',
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
    borderBottom: '1px solid var(--color-border)',
  };

  const badgeStyle = (color: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '999px',
    fontSize: 'var(--text-xs)',
    fontWeight: 700,
    color,
    backgroundColor: `${color}18`,
    border: `1px solid ${color}40`,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="User Management"
        description="Invite new team members and manage user invitations."
      />

      {/* Invite Form */}
      <div style={cardStyle}>
        <h3 style={{
          fontSize: 'var(--text-base)',
          fontWeight: 700,
          color: 'var(--color-text)',
          margin: '0 0 var(--space-4) 0',
        }}>
          ✉️ Invite New Member
        </h3>

        {apiError && <ErrorAlert message={apiError.message} code={apiError.code} />}
        {success && <div style={successStyle}>✅ {success}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-3)' }}>
          <FormField label="Email Address" id="invite-email" required>
            <input
              id="invite-email"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              disabled={pending}
            />
          </FormField>

          <FormField label="Assign Role" id="invite-role" required>
            <select
              id="invite-role"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              style={selectStyle}
              disabled={pending}
            >
              <option value="">Select a role...</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.label} ({r.code})</option>
              ))}
            </select>
          </FormField>

          <button type="submit" style={buttonStyle} disabled={pending}>
            {pending ? 'SENDING...' : 'SEND INVITATION'}
          </button>
        </form>
      </div>

      {/* Invitations Table */}
      <div style={cardStyle}>
        <h3 style={{
          fontSize: 'var(--text-base)',
          fontWeight: 700,
          color: 'var(--color-text)',
          margin: '0 0 var(--space-4) 0',
        }}>
          📋 Invitations ({invitations.length})
        </h3>

        {invitations.length === 0 ? (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            No invitations sent yet. Use the form above to invite your first team member.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Invited At</th>
                  <th style={thStyle}>Expires</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => {
                  const status = getStatus(inv);
                  return (
                    <tr key={inv.id}>
                      <td style={tdStyle}>{inv.email}</td>
                      <td style={tdStyle}>
                        <span style={badgeStyle('var(--color-primary)')}>{inv.role_label}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={badgeStyle(status.color)}>{status.label}</span>
                      </td>
                      <td style={tdStyle}>{formatDate(inv.created_at)}</td>
                      <td style={tdStyle}>{formatDate(inv.expires_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
