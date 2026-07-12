import React, { useState, useEffect, useCallback } from 'react';
import { FormField } from '../../components/FormField.tsx';
import { ErrorAlert } from '../../components/ErrorAlert.tsx';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import {
  fetchMaintenanceLogs,
  openMaintenance,
  closeMaintenance,
  MaintenanceLog,
} from './maintenanceApi.ts';

// ── Shared styles ─────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface-raised)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-5)',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 'var(--text-lg)',
  fontWeight: 700,
  marginBottom: 'var(--space-4)',
  color: 'var(--color-text)',
};

const inputStyle = (hasError = false): React.CSSProperties => ({
  width: '100%',
  height: 'var(--control-height)',
  backgroundColor: 'var(--color-surface)',
  border: `1px solid ${hasError ? 'var(--color-danger)' : 'var(--color-border)'}`,
  borderRadius: 'var(--radius-sm)',
  padding: '0 var(--space-3)',
  color: 'var(--color-text)',
  fontSize: 'var(--text-sm)',
  outline: 'none',
  boxSizing: 'border-box',
});

const textareaStyle = (hasError = false): React.CSSProperties => ({
  ...inputStyle(hasError),
  height: 'auto',
  padding: 'var(--space-2) var(--space-3)',
  resize: 'vertical',
  lineHeight: '1.5',
});

const primaryBtnStyle = (disabled = false): React.CSSProperties => ({
  height: 'var(--control-height)',
  padding: '0 var(--space-5)',
  backgroundColor: disabled ? 'var(--color-border)' : 'var(--color-primary)',
  color: disabled ? 'var(--color-text-muted)' : 'var(--color-primary-contrast)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  fontSize: 'var(--text-sm)',
  fontWeight: 700,
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'background-color 0.2s',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  whiteSpace: 'nowrap',
});

const ghostBtnStyle = (danger = false): React.CSSProperties => ({
  height: 'var(--control-height)',
  padding: '0 var(--space-4)',
  backgroundColor: 'transparent',
  color: danger ? 'var(--color-danger)' : 'var(--color-text-muted)',
  border: `1px solid ${danger ? 'var(--color-danger)' : 'var(--color-border)'}`,
  borderRadius: 'var(--radius-sm)',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
});

// ── Service type options ───────────────────────────────────────────────────

const SERVICE_TYPES = [
  'Routine Service',
  'Engine Repair',
  'Brake Service',
  'Tyre Replacement',
  'Electrical Repair',
  'Body Work',
  'AC Service',
  'Oil Change',
  'Transmission Repair',
  'Other',
];

// ── OpenMaintenanceForm ────────────────────────────────────────────────────

interface OpenMaintenanceFormProps {
  onOpened: (log: MaintenanceLog, msg: string) => void;
}

const OpenMaintenanceForm: React.FC<OpenMaintenanceFormProps> = ({ onOpened }) => {
  const [vehicleId, setVehicleId] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    const vid = Number(vehicleId);
    if (!vehicleId || !Number.isInteger(vid) || vid <= 0) e.vehicle_id = 'Enter a valid vehicle ID.';
    if (!serviceType) e.service_type = 'Select a service type.';
    if (!description.trim()) e.description = 'Description is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setApiError(null); setSuccessMsg(null);
    if (!validate()) return;
    setPending(true);
    try {
      const { log, message } = await openMaintenance({
        vehicle_id: Number(vehicleId),
        service_type: serviceType,
        description: description.trim(),
      });
      setSuccessMsg(message);
      setVehicleId(''); setServiceType(''); setDescription('');
      onOpened(log, message);
    } catch (err: any) {
      setApiError(err.message || 'Failed to open maintenance log.');
    } finally {
      setPending(false);
    }
  };

  const setField = (setter: (v: string) => void, field: string) => (val: string) => {
    setter(val);
    if (errors[field]) setErrors(e => { const n = { ...e }; delete n[field]; return n; });
  };

  return (
    <div style={cardStyle}>
      <h3 style={sectionTitleStyle}>Open Maintenance Log</h3>
      {successMsg && (
        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'rgba(67,181,104,0.1)', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)', color: 'var(--color-success)', fontSize: 'var(--text-sm)', fontWeight: 600 }} role="status" aria-live="polite">
          ✓ {successMsg}
        </div>
      )}
      {apiError && <ErrorAlert message={apiError} onDismiss={() => setApiError(null)} />}

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <FormField label="Vehicle ID" id="maint-vehicle-id" error={errors.vehicle_id} required
            helpText="Enter the numeric ID of the vehicle to check in.">
            <input
              id="maint-vehicle-id"
              type="number"
              min="1"
              step="1"
              value={vehicleId}
              onChange={e => setField(setVehicleId, 'vehicle_id')(e.target.value)}
              placeholder="e.g. 3"
              style={inputStyle(!!errors.vehicle_id)}
              disabled={pending}
            />
          </FormField>

          <FormField label="Service Type" id="maint-service-type" error={errors.service_type} required>
            <select
              id="maint-service-type"
              value={serviceType}
              onChange={e => setField(setServiceType, 'service_type')(e.target.value)}
              style={{
                ...inputStyle(!!errors.service_type),
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23A8B2BE' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '12px',
                paddingRight: '36px',
              }}
              disabled={pending}
            >
              <option value="">— Select type —</option>
              {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
        </div>

        <FormField label="Description" id="maint-desc" error={errors.description} required
          helpText="Describe the issue or work to be performed.">
          <textarea
            id="maint-desc"
            rows={3}
            maxLength={1000}
            value={description}
            onChange={e => setField(setDescription, 'description')(e.target.value)}
            placeholder="e.g. Engine making knocking sound during idle. Suspect worn bearings."
            style={textareaStyle(!!errors.description)}
            disabled={pending}
          />
        </FormField>

        <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" id="btn-open-maintenance" style={primaryBtnStyle(pending)} disabled={pending}>
            {pending ? '⏳ Checking In…' : '🔧 Check Vehicle into Shop'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ── CloseMaintenancePanel ──────────────────────────────────────────────────

interface CloseMaintenancePanelProps {
  log: MaintenanceLog;
  onClosed: (log: MaintenanceLog, msg: string) => void;
  onBack: () => void;
}

const CloseMaintenancePanel: React.FC<CloseMaintenancePanelProps> = ({ log, onClosed, onBack }) => {
  const [cost, setCost] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleClose = async () => {
    setError(null);
    const val = Number(cost);
    if (cost === '' || !Number.isFinite(val) || val < 0) {
      setError('Enter a valid cost (0 or more).');
      return;
    }
    setPending(true);
    try {
      const { log: updated, message } = await closeMaintenance(log.id, val);
      onClosed(updated, message);
    } catch (err: any) {
      setError(err.message || 'Failed to close maintenance log.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)', backgroundColor: 'rgba(67,181,104,0.04)' }}>
      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-3)' }}>
        Close Maintenance Log
      </div>

      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
        Closing this log will restore <strong style={{ color: 'var(--color-text)' }}>{log.vehicle_reg || `Vehicle #${log.vehicle_id}`}</strong> to <strong style={{ color: 'var(--color-success)' }}>AVAILABLE</strong>.
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <FormField label="Total Cost" id={`close-cost-${log.id}`} required unit="₹" helpText="Enter 0 if covered under warranty.">
          <input
            id={`close-cost-${log.id}`}
            type="number"
            min="0"
            step="0.01"
            value={cost}
            onChange={e => { setCost(e.target.value); setError(null); }}
            placeholder="e.g. 8500"
            style={{ ...inputStyle(!!error), width: '180px' }}
            disabled={pending}
          />
        </FormField>
        <div style={{ display: 'flex', gap: 'var(--space-3)', paddingBottom: 'var(--space-1)' }}>
          <button type="button" id={`btn-close-maint-${log.id}`} style={primaryBtnStyle(pending)} disabled={pending} onClick={handleClose}>
            {pending ? '⏳ Closing…' : '✓ Close & Release Vehicle'}
          </button>
          <button type="button" style={ghostBtnStyle()} onClick={onBack} disabled={pending}>Back</button>
        </div>
      </div>
    </div>
  );
};

// ── MaintenanceLogCard ─────────────────────────────────────────────────────

interface MaintenanceLogCardProps {
  log: MaintenanceLog;
  onClosed: (log: MaintenanceLog, msg: string) => void;
}

const MaintenanceLogCard: React.FC<MaintenanceLogCardProps> = ({ log, onClosed }) => {
  const [showClosePanel, setShowClosePanel] = useState(false);
  const isActive = log.status === 'ACTIVE';

  const daysOpen = (() => {
    const opened = new Date(log.opened_at);
    const end = log.closed_at ? new Date(log.closed_at) : new Date();
    return Math.floor((end.getTime() - opened.getTime()) / (1000 * 60 * 60 * 24));
  })();

  return (
    <div style={{ border: `1px solid ${isActive ? 'var(--color-warning, #f0a04b)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--color-surface)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', flexWrap: 'wrap' }}>
        {/* Log ID */}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-primary)', minWidth: '60px' }}>
          #{log.id}
        </span>

        {/* Vehicle */}
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)', minWidth: '100px' }}>
          {log.vehicle_reg || `Vehicle #${log.vehicle_id}`}
          {log.vehicle_name && <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}> — {log.vehicle_name}</span>}
        </span>

        {/* Service type */}
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', flex: 1, minWidth: '120px' }}>
          {log.service_type}
        </span>

        {/* Meta */}
        <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
          <span>{daysOpen === 0 ? 'Today' : `${daysOpen}d open`}</span>
          {!isActive && log.cost > 0 && <span>₹{Number(log.cost).toLocaleString('en-IN')}</span>}
          <span>{new Date(log.opened_at).toLocaleDateString()}</span>
        </div>

        <StatusBadge status={log.status} />

        {isActive && (
          <button
            type="button"
            id={`btn-close-panel-${log.id}`}
            style={showClosePanel ? ghostBtnStyle() : primaryBtnStyle()}
            onClick={() => setShowClosePanel(p => !p)}
          >
            {showClosePanel ? '▲ Cancel' : '✓ Close Job'}
          </button>
        )}
      </div>

      {/* Description */}
      <div style={{ padding: '0 var(--space-4) var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
        <strong style={{ color: 'var(--color-text)', marginRight: 'var(--space-2)' }}>Description:</strong>
        {log.description}
        {log.closed_at && (
          <span style={{ marginLeft: 'var(--space-4)', color: 'var(--color-success)' }}>
            Closed: {new Date(log.closed_at).toLocaleString()}
          </span>
        )}
      </div>

      {/* Close panel */}
      {showClosePanel && isActive && (
        <CloseMaintenancePanel
          log={log}
          onClosed={(updated, msg) => { setShowClosePanel(false); onClosed(updated, msg); }}
          onBack={() => setShowClosePanel(false)}
        />
      )}
    </div>
  );
};

// ── MaintenancePage ────────────────────────────────────────────────────────

export const MaintenancePage: React.FC = () => {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setLogs(await fetchMaintenanceLogs());
    } catch {
      setLoadError('Failed to load maintenance logs. Try refreshing.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleOpened = (log: MaintenanceLog, msg: string) => {
    setLogs(prev => [log, ...prev]);
    showToast(msg);
  };

  const handleClosed = (updated: MaintenanceLog, msg: string) => {
    setLogs(prev => prev.map(l => l.id === updated.id ? updated : l));
    showToast(msg);
  };

  const filtered = statusFilter === 'ALL' ? logs : logs.filter(l => l.status === statusFilter);

  const activeCount = logs.filter(l => l.status === 'ACTIVE').length;
  const closedCount = logs.filter(l => l.status === 'CLOSED').length;

  const toastStyle: React.CSSProperties = {
    position: 'fixed', bottom: 'var(--space-6)', right: 'var(--space-6)',
    backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-success)',
    borderLeft: '4px solid var(--color-success)', borderRadius: 'var(--radius-md)',
    padding: 'var(--space-3) var(--space-5)', color: 'var(--color-text)',
    fontSize: 'var(--text-sm)', fontWeight: 600, boxShadow: 'var(--shadow-panel)',
    zIndex: 1000, maxWidth: '420px', animation: 'slideUp 0.25s ease',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {successToast && <div style={toastStyle} role="status" aria-live="polite">✓ {successToast}</div>}

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>
            Maintenance Logs
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            Check vehicles into the shop, track service jobs, and release them back to the fleet.
          </p>
        </div>
        <button type="button" id="btn-refresh-maint" onClick={loadLogs} style={{ height: 'var(--control-height)', padding: '0 var(--space-4)', background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
          ↻ Refresh
        </button>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        {[
          { label: 'In Shop', value: activeCount, color: 'var(--color-warning, #f0a04b)' },
          { label: 'Completed', value: closedCount, color: 'var(--color-success)' },
          { label: 'Total', value: logs.length, color: 'var(--color-text)' },
        ].map(chip => (
          <div key={chip.label} style={{ padding: 'var(--space-2) var(--space-4)', backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
            <span style={{ fontWeight: 700, color: chip.color }}>{chip.value}</span>{' '}
            <span style={{ color: 'var(--color-text-muted)' }}>{chip.label}</span>
          </div>
        ))}
      </div>

      {/* Open maintenance form */}
      <OpenMaintenanceForm onOpened={handleOpened} />

      {/* Log board */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <h3 style={{ ...sectionTitleStyle, marginBottom: 0 }}>Shop Log</h3>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {(['ALL', 'ACTIVE', 'CLOSED'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                style={{
                  height: '32px',
                  padding: '0 var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: statusFilter === f ? 'var(--color-primary)' : 'transparent',
                  color: statusFilter === f ? 'var(--color-primary-contrast)' : 'var(--color-text-muted)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {f === 'ALL' ? 'All' : f === 'ACTIVE' ? 'In Shop' : 'Completed'}
              </button>
            ))}
          </div>
        </div>

        {loadError && <ErrorAlert message={loadError} onDismiss={() => setLoadError(null)} />}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: '80px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface-hover)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '32px', marginBottom: 'var(--space-3)' }}>🔧</div>
            <div style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>
              {statusFilter !== 'ALL' ? `No ${statusFilter === 'ACTIVE' ? 'active' : 'completed'} maintenance logs.` : 'No maintenance logs yet.'}
            </div>
            <div style={{ fontSize: 'var(--text-sm)' }}>
              Use the form above to check a vehicle into the shop.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {filtered.map(log => (
              <MaintenanceLogCard key={log.id} log={log} onClosed={handleClosed} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
};
