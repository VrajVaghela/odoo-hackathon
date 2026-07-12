import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/PageHeader.tsx';
import { FormField } from '../../components/FormField.tsx';
import { ErrorAlert } from '../../components/ErrorAlert.tsx';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import { EmptyState } from '../../components/EmptyState.tsx';
import { LoadingState } from '../../components/LoadingState.tsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.tsx';
import { fetchVehicles, Vehicle } from '../vehicles/vehiclesApi.ts';
import {
  fetchMaintenanceLogs,
  openMaintenance,
  closeMaintenance,
  MaintenanceLog,
} from './maintenanceApi.ts';

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

const pageStackStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-6)',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface-raised)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-5)',
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 'var(--space-4)',
  flexWrap: 'wrap',
  marginBottom: 'var(--space-4)',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 'var(--text-lg)',
  fontWeight: 700,
  color: 'var(--color-text)',
  margin: 0,
};

const inputStyle = (hasError = false): React.CSSProperties => ({
  width: '100%',
  height: 'var(--control-height)',
  backgroundColor: 'var(--color-surface)',
  border: `1px solid ${hasError ? 'var(--color-danger)' : 'var(--color-border)'}`,
  borderRadius: 'var(--radius-sm)',
  color: 'var(--color-text)',
  fontSize: 'var(--text-sm)',
  padding: '0 var(--space-3)',
});

const textareaStyle = (hasError = false): React.CSSProperties => ({
  ...inputStyle(hasError),
  minHeight: 'calc(var(--control-height) * 2)',
  height: 'auto',
  lineHeight: 'var(--leading-normal)',
  padding: 'var(--space-2) var(--space-3)',
  resize: 'vertical',
});

const selectStyle = (hasError = false): React.CSSProperties => ({
  ...inputStyle(hasError),
  cursor: 'pointer',
});

const primaryButtonStyle = (disabled = false): React.CSSProperties => ({
  height: 'var(--control-height)',
  padding: '0 var(--space-5)',
  backgroundColor: disabled ? 'var(--color-border)' : 'var(--color-primary)',
  color: disabled ? 'var(--color-text-muted)' : 'var(--color-primary-contrast)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  fontSize: 'var(--text-sm)',
  fontWeight: 700,
  cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  whiteSpace: 'nowrap',
});

const secondaryButtonStyle = (danger = false): React.CSSProperties => ({
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

const metricStripStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))',
  gap: 'var(--space-3)',
};

const metricItemStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface-raised)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-4)',
};

type StatusFilter = 'ALL' | 'ACTIVE' | 'CLOSED';

interface ApiFailure {
  message: string;
  field?: string;
}

function getApiFailure(error: unknown, fallback: string): ApiFailure {
  if (error instanceof Error) {
    const maybeField = (error as Error & { field?: string }).field;
    return { message: error.message || fallback, field: maybeField };
  }
  return { message: fallback };
}

function formatDate(value: string | null): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function getVehicleLabel(vehicle: Vehicle): string {
  return `${vehicle.registration_number} - ${vehicle.name} (${vehicle.status})`;
}

interface OpenMaintenanceFormProps {
  vehicles: Vehicle[];
  loadingVehicles: boolean;
  onOpened: (log: MaintenanceLog, message: string) => void;
  onVehicleStatusChanged: (vehicleId: number, status: Vehicle['status']) => void;
}

const OpenMaintenanceForm: React.FC<OpenMaintenanceFormProps> = ({
  vehicles,
  loadingVehicles,
  onOpened,
  onVehicleStatusChanged,
}) => {
  const [vehicleId, setVehicleId] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const selectedVehicle = vehicles.find((vehicle) => String(vehicle.id) === vehicleId);
  const eligibleVehicles = vehicles.filter((vehicle) => vehicle.status === 'AVAILABLE');

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!vehicleId) nextErrors.vehicleId = 'Select a vehicle to check into maintenance.';
    if (selectedVehicle && selectedVehicle.status !== 'AVAILABLE') {
      nextErrors.vehicleId = `${selectedVehicle.registration_number} is ${selectedVehicle.status.replace(/_/g, ' ')}. Select an available vehicle.`;
    }
    if (!serviceType) nextErrors.serviceType = 'Select the maintenance service type.';
    if (!description.trim()) nextErrors.description = 'Describe the maintenance work.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const setField = (field: string, value: string, setter: (next: string) => void) => {
    setter(value);
    if (errors[field]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    setApiError(null);
    if (!validate()) return;

    setPending(true);
    try {
      const { log, message } = await openMaintenance({
        vehicle_id: Number(vehicleId),
        service_type: serviceType,
        description: description.trim(),
      });
      setVehicleId('');
      setServiceType('');
      setDescription('');
      onVehicleStatusChanged(log.vehicle_id, 'IN_SHOP');
      onOpened(log, message);
    } catch (error) {
      const failure = getApiFailure(error, 'Failed to open maintenance.');
      setApiError(failure.message);
      const field = failure.field;
      if (field) setErrors((current) => ({ ...current, [field]: failure.message }));
    } finally {
      setPending(false);
    }
  };

  return (
    <section style={cardStyle} aria-labelledby="open-maintenance-title">
      <div style={sectionHeaderStyle}>
        <div>
          <h3 id="open-maintenance-title" style={sectionTitleStyle}>Open Maintenance</h3>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            Checking a vehicle into the shop immediately removes it from dispatch availability.
          </p>
        </div>
        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', fontWeight: 700 }}>
          {eligibleVehicles.length} available
        </span>
      </div>

      {apiError && <ErrorAlert message={apiError} onDismiss={() => setApiError(null)} />}

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))', gap: 'var(--space-4)' }}>
          <FormField label="Vehicle" id="maintenance-vehicle" error={errors.vehicleId} required>
            <select
              id="maintenance-vehicle"
              value={vehicleId}
              onChange={(event) => setField('vehicleId', event.target.value, setVehicleId)}
              style={selectStyle(Boolean(errors.vehicleId))}
              disabled={pending || loadingVehicles}
            >
              <option value="">{loadingVehicles ? 'Loading vehicles...' : 'Select available vehicle'}</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id} disabled={vehicle.status !== 'AVAILABLE'}>
                  {getVehicleLabel(vehicle)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Service Type" id="maintenance-service-type" error={errors.serviceType} required>
            <select
              id="maintenance-service-type"
              value={serviceType}
              onChange={(event) => setField('serviceType', event.target.value, setServiceType)}
              style={selectStyle(Boolean(errors.serviceType))}
              disabled={pending}
            >
              <option value="">Select service type</option>
              {SERVICE_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </FormField>
        </div>

        {selectedVehicle && (
          <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusBadge status={selectedVehicle.status} />
            <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
              {selectedVehicle.vehicle_type} in {selectedVehicle.region}, odometer {Number(selectedVehicle.odometer_km).toLocaleString('en-IN')} km
            </span>
          </div>
        )}

        <div style={{ marginTop: 'var(--space-4)' }}>
          <FormField label="Description" id="maintenance-description" error={errors.description} required>
            <textarea
              id="maintenance-description"
              rows={3}
              maxLength={1000}
              value={description}
              onChange={(event) => setField('description', event.target.value, setDescription)}
              placeholder="Describe the issue or scheduled service."
              style={textareaStyle(Boolean(errors.description))}
              disabled={pending}
            />
          </FormField>
        </div>

        <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            style={primaryButtonStyle(pending || loadingVehicles)}
            disabled={pending || loadingVehicles}
          >
            {pending ? 'Opening...' : 'Open Maintenance'}
          </button>
        </div>
      </form>
    </section>
  );
};

interface MaintenanceLogCardProps {
  log: MaintenanceLog;
  onClosed: (log: MaintenanceLog, message: string) => void;
  onVehicleStatusChanged: (vehicleId: number, status: Vehicle['status']) => void;
}

const MaintenanceLogCard: React.FC<MaintenanceLogCardProps> = ({
  log,
  onClosed,
  onVehicleStatusChanged,
}) => {
  const [showClosePanel, setShowClosePanel] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cost, setCost] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isActive = log.status === 'ACTIVE';
  const vehicleName = log.vehicle_reg || `Vehicle #${log.vehicle_id}`;

<<<<<<< HEAD
  const handleConfirmClose = async () => {
=======
  const handleClose = async () => {
    if (pending) return;
>>>>>>> e93cde4 (feat: harden trip lifecycle and UI guards)
    setError(null);
    const parsedCost = Number(cost);
    if (cost === '' || !Number.isFinite(parsedCost) || parsedCost < 0) {
      setConfirmOpen(false);
      setError('Enter a non-negative maintenance cost before closing.');
      return;
    }

    setPending(true);
    try {
      const { log: updatedLog, message } = await closeMaintenance(log.id, parsedCost);
      setConfirmOpen(false);
      setShowClosePanel(false);
      setCost('');
      onVehicleStatusChanged(updatedLog.vehicle_id, 'AVAILABLE');
      onClosed(updatedLog, message);
    } catch (apiError) {
      const failure = getApiFailure(apiError, 'Failed to close maintenance.');
      setConfirmOpen(false);
      setError(failure.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <article style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 'var(--space-4)', padding: 'var(--space-4)', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>#{log.id}</span>
            <strong style={{ color: 'var(--color-text)' }}>{vehicleName}</strong>
            {log.vehicle_name && <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{log.vehicle_name}</span>}
            <StatusBadge status={log.status} />
          </div>
          <div style={{ color: 'var(--color-text)', fontSize: 'var(--text-sm)', fontWeight: 700 }}>{log.service_type}</div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: 0 }}>{log.description}</p>
          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
            <span>Opened {formatDate(log.opened_at)}</span>
            {log.closed_at && <span>Closed {formatDate(log.closed_at)}</span>}
            {!isActive && <span>{formatMoney(log.cost)}</span>}
          </div>
        </div>

        {isActive && (
          <button
            type="button"
            style={showClosePanel ? primaryButtonStyle() : secondaryButtonStyle()}
            onClick={() => {
              setShowClosePanel((current) => !current);
              setError(null);
            }}
          >
            {showClosePanel ? 'Hide Close Form' : 'Close Job'}
          </button>
        )}
      </div>

      {showClosePanel && isActive && (
        <div style={{ borderTop: '1px solid var(--color-border)', padding: 'var(--space-4)', backgroundColor: 'var(--color-surface-raised)' }}>
          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <FormField label="Total Cost" id={`maintenance-cost-${log.id}`} required unit="INR" error={error ?? undefined}>
              <input
                id={`maintenance-cost-${log.id}`}
                type="number"
                min="0"
                step="0.01"
                value={cost}
                onChange={(event) => {
                  setCost(event.target.value);
                  setError(null);
                }}
                style={inputStyle(Boolean(error))}
                disabled={pending}
              />
            </FormField>
            <button
              type="button"
              style={primaryButtonStyle(pending)}
              disabled={pending}
              onClick={() => setConfirmOpen(true)}
            >
              {pending ? 'Closing...' : 'Close and Release'}
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Close Maintenance?"
        message={`Closing job #${log.id} will release ${vehicleName} back to Available unless the vehicle has been retired.`}
        confirmLabel="Close Job"
        cancelLabel="Keep Open"
        pending={pending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmClose}
      />
    </article>
  );
};

export const MaintenancePage: React.FC = () => {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoadError(null);
    setLoadingLogs(true);
    setLoadingVehicles(true);
    try {
      const [nextLogs, nextVehicles] = await Promise.all([
        fetchMaintenanceLogs(),
        fetchVehicles(),
      ]);
      setLogs(nextLogs);
      setVehicles(nextVehicles);
    } catch (error) {
      const failure = getApiFailure(error, 'Failed to load maintenance data.');
      setLoadError(failure.message);
    } finally {
      setLoadingLogs(false);
      setLoadingVehicles(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredLogs = useMemo(() => {
    return statusFilter === 'ALL' ? logs : logs.filter((log) => log.status === statusFilter);
  }, [logs, statusFilter]);

  const counts = useMemo(() => {
    const active = logs.filter((log) => log.status === 'ACTIVE').length;
    const closed = logs.filter((log) => log.status === 'CLOSED').length;
    const available = vehicles.filter((vehicle) => vehicle.status === 'AVAILABLE').length;
    const inShop = vehicles.filter((vehicle) => vehicle.status === 'IN_SHOP').length;
    return { active, closed, available, inShop };
  }, [logs, vehicles]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    window.setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleOpened = (log: MaintenanceLog, message: string) => {
    setLogs((current) => [log, ...current]);
    showSuccess(message);
  };

  const handleClosed = (updatedLog: MaintenanceLog, message: string) => {
    setLogs((current) => current.map((log) => (log.id === updatedLog.id ? updatedLog : log)));
    showSuccess(message);
  };

  const handleVehicleStatusChanged = (vehicleId: number, status: Vehicle['status']) => {
    setVehicles((current) => current.map((vehicle) => (
      vehicle.id === vehicleId ? { ...vehicle, status } : vehicle
    )));
  };

  const filterButtons: Array<{ value: StatusFilter; label: string }> = [
    { value: 'ALL', label: 'All' },
    { value: 'ACTIVE', label: 'In Shop' },
    { value: 'CLOSED', label: 'Closed' },
  ];

  return (
    <div style={pageStackStyle}>
      <PageHeader
        title="Maintenance"
        description="Open service jobs, move vehicles into the shop, and release them when work is complete."
        actions={(
          <button type="button" style={secondaryButtonStyle()} onClick={loadData}>
            Refresh
          </button>
        )}
      />

      {successMessage && (
        <div role="status" aria-live="polite" style={{ ...cardStyle, borderColor: 'var(--color-success)', color: 'var(--color-text)' }}>
          {successMessage}
        </div>
      )}

      {loadError && <ErrorAlert message={loadError} onDismiss={() => setLoadError(null)} />}

      <div style={metricStripStyle}>
        {[
          { label: 'In Shop', value: counts.active, color: 'var(--color-warning)' },
          { label: 'Completed Jobs', value: counts.closed, color: 'var(--color-success)' },
          { label: 'Available Vehicles', value: counts.available, color: 'var(--color-success)' },
          { label: 'Fleet In Shop', value: counts.inShop, color: 'var(--color-warning)' },
        ].map((metric) => (
          <div key={metric.label} style={metricItemStyle}>
            <div style={{ color: metric.color, fontSize: 'var(--text-2xl)', fontWeight: 800, lineHeight: 'var(--leading-tight)' }}>
              {metric.value}
            </div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase' }}>
              {metric.label}
            </div>
          </div>
        ))}
      </div>

      <OpenMaintenanceForm
        vehicles={vehicles}
        loadingVehicles={loadingVehicles}
        onOpened={handleOpened}
        onVehicleStatusChanged={handleVehicleStatusChanged}
      />

      <section style={cardStyle} aria-labelledby="shop-log-title">
        <div style={sectionHeaderStyle}>
          <h3 id="shop-log-title" style={sectionTitleStyle}>Shop Log</h3>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }} role="group" aria-label="Maintenance status filter">
            {filterButtons.map((filter) => {
              const active = statusFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  style={active ? primaryButtonStyle() : secondaryButtonStyle()}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {loadingLogs ? (
          <LoadingState rows={3} variant="cards" />
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            icon="!"
            title={statusFilter === 'ALL' ? 'No maintenance logs yet' : `No ${statusFilter.toLowerCase()} maintenance logs`}
            description="Use the form above to check an available vehicle into the shop."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {filteredLogs.map((log) => (
              <MaintenanceLogCard
                key={log.id}
                log={log}
                onClosed={handleClosed}
                onVehicleStatusChanged={handleVehicleStatusChanged}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
