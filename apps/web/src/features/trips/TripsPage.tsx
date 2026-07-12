import React, { useState, useEffect, useCallback } from 'react';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import { FormField } from '../../components/FormField.tsx';
import { ErrorAlert } from '../../components/ErrorAlert.tsx';
import { TripLifecycle } from '../../components/TripLifecycle.tsx';
import { DispatchEligibilityNotice, EligibilityConflict } from '../../components/DispatchEligibilityNotice.tsx';
import {
  fetchTrips,
  createTrip,
  dispatchTrip,
  fetchDispatchOptions,
  Trip,
  AvailableVehicle,
  AvailableDriver,
} from './tripsApi.ts';

// ------ Reusable input style ------
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

const selectStyle = (hasError = false): React.CSSProperties => ({
  ...inputStyle(hasError),
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23A8B2BE' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  backgroundSize: '12px',
  paddingRight: '36px',
});

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

const primaryBtnStyle = (disabled = false): React.CSSProperties => ({
  height: 'var(--control-height)',
  padding: '0 var(--space-6)',
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

// ──────────────────────────────────────────────
// Create Trip Form
// ──────────────────────────────────────────────
interface CreateTripFormProps {
  onCreated: (trip: Trip) => void;
}

const CreateTripForm: React.FC<CreateTripFormProps> = ({ onCreated }) => {
  const [form, setForm] = useState({
    source: '',
    destination: '',
    cargo_weight_kg: '',
    planned_distance_km: '',
    revenue: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.source.trim()) e.source = 'Source location is required.';
    if (!form.destination.trim()) e.destination = 'Destination is required.';
    if (form.source.trim() === form.destination.trim() && form.source.trim()) {
      e.destination = 'Source and destination must differ.';
    }
    const cargo = Number(form.cargo_weight_kg);
    if (!form.cargo_weight_kg || !Number.isFinite(cargo) || cargo <= 0) {
      e.cargo_weight_kg = 'Must be a positive number.';
    }
    const dist = Number(form.planned_distance_km);
    if (!form.planned_distance_km || !Number.isFinite(dist) || dist <= 0) {
      e.planned_distance_km = 'Must be a positive number.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setApiError(null);
    setSuccessMsg(null);
    if (!validate()) return;
    setPending(true);
    try {
      const trip = await createTrip({
        source: form.source.trim(),
        destination: form.destination.trim(),
        cargo_weight_kg: Number(form.cargo_weight_kg),
        planned_distance_km: Number(form.planned_distance_km),
        revenue: form.revenue ? Number(form.revenue) : 0,
      });
      setSuccessMsg(`Trip ${trip.trip_code} created as DRAFT.`);
      setForm({ source: '', destination: '', cargo_weight_kg: '', planned_distance_km: '', revenue: '' });
      onCreated(trip);
    } catch (err: any) {
      setApiError(err.message || 'Failed to create trip.');
    } finally {
      setPending(false);
    }
  };

  const setField = (name: string, val: string) => {
    setForm((f) => ({ ...f, [name]: val }));
    if (errors[name]) setErrors((e) => { const n = { ...e }; delete n[name]; return n; });
  };

  return (
    <div style={cardStyle}>
      <h3 style={sectionTitleStyle}>Create New Trip</h3>
      {successMsg && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          backgroundColor: 'rgba(67,181,104,0.1)',
          border: '1px solid var(--color-success)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 'var(--space-4)',
          color: 'var(--color-success)',
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
        }} role="status" aria-live="polite">
          ✓ {successMsg}
        </div>
      )}
      {apiError && (
        <ErrorAlert message={apiError} onDismiss={() => setApiError(null)} />
      )}
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <FormField label="Source" id="trip-source" error={errors.source} required>
            <input
              id="trip-source"
              type="text"
              value={form.source}
              onChange={(e) => setField('source', e.target.value)}
              placeholder="e.g. Mumbai Depot"
              style={inputStyle(!!errors.source)}
              disabled={pending}
            />
          </FormField>
          <FormField label="Destination" id="trip-dest" error={errors.destination} required>
            <input
              id="trip-dest"
              type="text"
              value={form.destination}
              onChange={(e) => setField('destination', e.target.value)}
              placeholder="e.g. Pune Hub"
              style={inputStyle(!!errors.destination)}
              disabled={pending}
            />
          </FormField>
          <FormField label="Cargo Weight" id="trip-cargo" error={errors.cargo_weight_kg} required unit="kg">
            <input
              id="trip-cargo"
              type="number"
              min="0.01"
              step="0.01"
              value={form.cargo_weight_kg}
              onChange={(e) => setField('cargo_weight_kg', e.target.value)}
              placeholder="e.g. 450"
              style={inputStyle(!!errors.cargo_weight_kg)}
              disabled={pending}
            />
          </FormField>
          <FormField label="Planned Distance" id="trip-dist" error={errors.planned_distance_km} required unit="km">
            <input
              id="trip-dist"
              type="number"
              min="0.01"
              step="0.01"
              value={form.planned_distance_km}
              onChange={(e) => setField('planned_distance_km', e.target.value)}
              placeholder="e.g. 180"
              style={inputStyle(!!errors.planned_distance_km)}
              disabled={pending}
            />
          </FormField>
          <FormField label="Revenue" id="trip-rev" helpText="Optional – leave 0 if not yet confirmed." unit="₹">
            <input
              id="trip-rev"
              type="number"
              min="0"
              step="0.01"
              value={form.revenue}
              onChange={(e) => setField('revenue', e.target.value)}
              placeholder="e.g. 15000"
              style={inputStyle()}
              disabled={pending}
            />
          </FormField>
        </div>
        <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" style={primaryBtnStyle(pending)} disabled={pending} id="btn-create-trip">
            {pending ? '⏳ Creating...' : '+ Create Draft Trip'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ──────────────────────────────────────────────
// Dispatch Panel (inline for a selected DRAFT trip)
// ──────────────────────────────────────────────
interface DispatchPanelProps {
  trip: Trip;
  onDispatched: (trip: Trip, msg: string) => void;
}

const DispatchPanel: React.FC<DispatchPanelProps> = ({ trip, onDispatched }) => {
  const [vehicles, setVehicles] = useState<AvailableVehicle[]>([]);
  const [drivers, setDrivers] = useState<AvailableDriver[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [eligibilityConflict, setEligibilityConflict] = useState<EligibilityConflict | null>(null);
  const [pending, setPending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchDispatchOptions()
      .then(({ vehicles: v, drivers: d }) => {
        setVehicles(v);
        setDrivers(d);
      })
      .catch(() => setLoadError('Could not load available resources. Refresh to retry.'));
  }, [trip.id]);

  // Client-side capacity pre-check when vehicle selection changes
  const selectedVehicle = vehicles.find((v) => String(v.id) === selectedVehicleId) ?? null;

  const clientConflict: EligibilityConflict | null = (() => {
    if (selectedVehicle && Number(trip.cargo_weight_kg) > Number(selectedVehicle.max_capacity_kg)) {
      return {
        code: 'CARGO_EXCEEDS_CAPACITY',
        cargoKg: Number(trip.cargo_weight_kg),
        capacityKg: Number(selectedVehicle.max_capacity_kg),
        vehicleReg: selectedVehicle.registration_number,
      };
    }
    return null;
  })();

  const displayConflict = eligibilityConflict ?? clientConflict;
  const canDispatch = selectedVehicleId && selectedDriverId && !clientConflict && !pending;

  const handleDispatch = async () => {
    setEligibilityConflict(null);
    setPending(true);
    try {
      const { trip: updated, message } = await dispatchTrip(
        trip.id,
        Number(selectedVehicleId),
        Number(selectedDriverId)
      );
      onDispatched(updated, message);
    } catch (err: any) {
      const conflict: EligibilityConflict = {
        code: err.code || 'DISPATCH_FAILED',
        message: err.message || 'Dispatch was rejected by the server.',
      };
      setEligibilityConflict(conflict);
    } finally {
      setPending(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  if (loadError) {
    return (
      <div style={{ padding: 'var(--space-4)', color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>
        ⚠ {loadError}
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Dispatch Configuration
      </div>

      {displayConflict && <DispatchEligibilityNotice conflict={displayConflict} />}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
        <FormField label="Assign Vehicle" id={`vehicle-select-${trip.id}`}>
          <select
            id={`vehicle-select-${trip.id}`}
            value={selectedVehicleId}
            onChange={(e) => { setSelectedVehicleId(e.target.value); setEligibilityConflict(null); }}
            style={selectStyle()}
            disabled={pending}
          >
            <option value="">— Select vehicle —</option>
            {vehicles.map((v) => (
              <option key={v.id} value={String(v.id)}>
                {v.registration_number} — {v.name} ({v.max_capacity_kg} kg)
              </option>
            ))}
          </select>
          {selectedVehicle && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Capacity: {selectedVehicle.max_capacity_kg} kg · Type: {selectedVehicle.vehicle_type} · {selectedVehicle.region}
            </div>
          )}
        </FormField>

        <FormField label="Assign Driver" id={`driver-select-${trip.id}`}>
          <select
            id={`driver-select-${trip.id}`}
            value={selectedDriverId}
            onChange={(e) => { setSelectedDriverId(e.target.value); setEligibilityConflict(null); }}
            style={selectStyle()}
            disabled={pending}
          >
            <option value="">— Select driver —</option>
            {drivers.map((d) => {
              const expired = d.licence_expiry_date < today;
              return (
                <option key={d.id} value={String(d.id)} disabled={expired}>
                  {d.full_name} — {d.licence_category}{expired ? ' ⚠ EXPIRED' : ''}
                </option>
              );
            })}
          </select>
        </FormField>
      </div>

      <button
        type="button"
        id={`btn-dispatch-${trip.id}`}
        style={primaryBtnStyle(!canDispatch)}
        disabled={!canDispatch}
        onClick={handleDispatch}
        aria-disabled={!canDispatch}
      >
        {pending ? '⏳ Dispatching...' : '▶ Dispatch Trip'}
      </button>
      {!selectedVehicleId || !selectedDriverId ? (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginLeft: 'var(--space-3)' }}>
          Select vehicle and driver to enable dispatch.
        </span>
      ) : null}
    </div>
  );
};

// ──────────────────────────────────────────────
// Trip Card (in the live board)
// ──────────────────────────────────────────────
interface TripCardProps {
  trip: Trip;
  expanded: boolean;
  onToggle: () => void;
  onDispatched: (trip: Trip, msg: string) => void;
}

const TripCard: React.FC<TripCardProps> = ({ trip, expanded, onToggle, onDispatched }) => {
  const isDraft = trip.status === 'DRAFT';

  const rowStyle: React.CSSProperties = {
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    backgroundColor: 'var(--color-surface)',
    transition: 'border-color 0.15s',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-3) var(--space-4)',
    cursor: isDraft ? 'pointer' : 'default',
    backgroundColor: expanded ? 'var(--color-surface-hover)' : 'transparent',
    transition: 'background-color 0.15s',
    flexWrap: 'wrap',
  };

  const codeStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--text-sm)',
    fontWeight: 700,
    color: 'var(--color-primary)',
    minWidth: '80px',
  };

  const routeStyle: React.CSSProperties = {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
    flex: 1,
    minWidth: '140px',
  };

  const metaStyle: React.CSSProperties = {
    display: 'flex',
    gap: 'var(--space-4)',
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    flexWrap: 'wrap',
  };

  return (
    <div style={rowStyle}>
      <div
        style={headerStyle}
        onClick={isDraft ? onToggle : undefined}
        role={isDraft ? 'button' : undefined}
        tabIndex={isDraft ? 0 : undefined}
        aria-expanded={isDraft ? expanded : undefined}
        onKeyDown={isDraft ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } } : undefined}
      >
        <span style={codeStyle}>{trip.trip_code}</span>
        <span style={routeStyle}>{trip.source} → {trip.destination}</span>
        <div style={metaStyle}>
          <span>{Number(trip.cargo_weight_kg).toFixed(0)} kg</span>
          <span>{Number(trip.planned_distance_km).toFixed(0)} km</span>
          {trip.vehicle_reg && <span>{trip.vehicle_reg}</span>}
          {trip.driver_name && <span>{trip.driver_name}</span>}
        </div>
        <StatusBadge status={trip.status} />
        {isDraft && (
          <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }} aria-hidden="true">
            {expanded ? '▲' : '▼'}
          </span>
        )}
      </div>

      {/* Lifecycle stepper for non-draft trips */}
      {!isDraft && (
        <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
          <TripLifecycle status={trip.status} tripCode={trip.trip_code} />
          {trip.dispatched_at && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-3)' }}>
              Dispatched: {new Date(trip.dispatched_at).toLocaleString()}
              {trip.vehicle_reg && ` · Vehicle: ${trip.vehicle_reg}`}
              {trip.driver_name && ` · Driver: ${trip.driver_name}`}
            </div>
          )}
        </div>
      )}

      {/* Dispatch panel for expanded DRAFT trips */}
      {isDraft && expanded && (
        <DispatchPanel trip={trip} onDispatched={onDispatched} />
      )}
    </div>
  );
};

// ──────────────────────────────────────────────
// Main Trips Page
// ──────────────────────────────────────────────
interface TripsPageProps {
  userRole: string;
}

export const TripsPage: React.FC<TripsPageProps> = ({ userRole }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const isDispatcher = userRole === 'DISPATCHER';

  const loadTrips = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchTrips(statusFilter || undefined);
      setTrips(data);
    } catch {
      setLoadError('Failed to load trips. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleTripCreated = (trip: Trip) => {
    setTrips((prev) => [trip, ...prev]);
    setExpandedId(trip.id); // auto-expand the new draft for quick dispatch
    showToast(`${trip.trip_code} created as DRAFT. Assign vehicle and driver to dispatch.`);
  };

  const handleDispatched = (updated: Trip, msg: string) => {
    setTrips((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setExpandedId(null);
    showToast(msg);
  };

  // Status filter options
  const statusOptions = ['', 'DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'];

  const pageHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 'var(--space-6)',
    gap: 'var(--space-4)',
    flexWrap: 'wrap',
  };

  const pageTitleStyle: React.CSSProperties = {
    fontSize: 'var(--text-xl)',
    fontWeight: 800,
    marginBottom: 'var(--space-1)',
    color: 'var(--color-text)',
  };

  const pageDescStyle: React.CSSProperties = {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
  };

  const filterRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 'var(--space-3)',
    alignItems: 'center',
    marginBottom: 'var(--space-5)',
    flexWrap: 'wrap',
  };

  const toastStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 'var(--space-6)',
    right: 'var(--space-6)',
    backgroundColor: 'var(--color-surface-raised)',
    border: '1px solid var(--color-success)',
    borderLeft: '4px solid var(--color-success)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-3) var(--space-5)',
    color: 'var(--color-text)',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    boxShadow: 'var(--shadow-panel)',
    zIndex: 1000,
    maxWidth: '420px',
    animation: 'slideUp 0.25s ease',
  };

  // Grouped counts
  const draftCount = trips.filter((t) => t.status === 'DRAFT').length;
  const dispatchedCount = trips.filter((t) => t.status === 'DISPATCHED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Toast */}
      {successToast && (
        <div style={toastStyle} role="status" aria-live="polite">
          ✓ {successToast}
        </div>
      )}

      {/* Page header */}
      <div style={pageHeaderStyle}>
        <div>
          <h2 style={pageTitleStyle}>Trips & Dispatch</h2>
          <p style={pageDescStyle}>
            Plan routes, dispatch trips, and monitor active assignments.
          </p>
        </div>
        <button
          type="button"
          id="btn-refresh-trips"
          onClick={loadTrips}
          style={{
            height: 'var(--control-height)',
            padding: '0 var(--space-4)',
            background: 'none',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-text-muted)',
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div style={{ padding: 'var(--space-2) var(--space-4)', backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          <span style={{ fontWeight: 700, color: 'var(--color-neutral)' }}>{draftCount}</span>{' '}
          <span style={{ color: 'var(--color-text-muted)' }}>Draft</span>
        </div>
        <div style={{ padding: 'var(--space-2) var(--space-4)', backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          <span style={{ fontWeight: 700, color: 'var(--color-info)' }}>{dispatchedCount}</span>{' '}
          <span style={{ color: 'var(--color-text-muted)' }}>On Trip</span>
        </div>
        <div style={{ padding: 'var(--space-2) var(--space-4)', backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{trips.length}</span>{' '}
          <span style={{ color: 'var(--color-text-muted)' }}>Total</span>
        </div>
      </div>

      {/* Create trip form (Dispatcher only) */}
      {isDispatcher && <CreateTripForm onCreated={handleTripCreated} />}

      {/* Live Board */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ ...sectionTitleStyle, marginBottom: 0 }}>Live Dispatch Board</h3>
          <div style={filterRowStyle}>
            <label htmlFor="status-filter" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              Filter:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ ...selectStyle(), width: '150px' }}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s || 'All Statuses'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadError && <ErrorAlert message={loadError} onDismiss={() => setLoadError(null)} />}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: '52px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-surface-hover)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '32px', marginBottom: 'var(--space-3)' }}>🚛</div>
            <div style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>
              {statusFilter ? `No ${statusFilter} trips found.` : 'No trips yet.'}
            </div>
            <div style={{ fontSize: 'var(--text-sm)' }}>
              {isDispatcher ? 'Create a draft trip above to get started.' : 'Trips will appear here once created.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                expanded={expandedId === trip.id}
                onToggle={() => setExpandedId(expandedId === trip.id ? null : trip.id)}
                onDispatched={handleDispatched}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};
