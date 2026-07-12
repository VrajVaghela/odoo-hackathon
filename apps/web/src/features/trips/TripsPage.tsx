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
  completeTrip,
  cancelTrip,
  Trip,
  AvailableVehicle,
  AvailableDriver,
} from './tripsApi.ts';

// ── Shared style helpers ───────────────────────────────────────────────────

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

const selectStyle = (): React.CSSProperties => ({
  ...inputStyle(),
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
  transition: 'all 0.15s',
  whiteSpace: 'nowrap',
});

const panelStyle: React.CSSProperties = {
  padding: 'var(--space-4)',
  borderTop: '1px solid var(--color-border)',
};

const panelLabelStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 700,
  color: 'var(--color-text-muted)',
  marginBottom: 'var(--space-3)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

// ── CreateTripForm ─────────────────────────────────────────────────────────

interface CreateTripFormProps {
  onCreated: (trip: Trip) => void;
}

const CreateTripForm: React.FC<CreateTripFormProps> = ({ onCreated }) => {
  const [form, setForm] = useState({
    source: '', destination: '', cargo_weight_kg: '', planned_distance_km: '', revenue: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.source.trim()) e.source = 'Source is required.';
    if (!form.destination.trim()) e.destination = 'Destination is required.';
    if (form.source.trim() && form.source.trim() === form.destination.trim()) e.destination = 'Must differ from source.';
    const cargo = Number(form.cargo_weight_kg);
    if (!form.cargo_weight_kg || !Number.isFinite(cargo) || cargo <= 0) e.cargo_weight_kg = 'Must be a positive number.';
    const dist = Number(form.planned_distance_km);
    if (!form.planned_distance_km || !Number.isFinite(dist) || dist <= 0) e.planned_distance_km = 'Must be a positive number.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setApiError(null); setSuccessMsg(null);
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
    setForm(f => ({ ...f, [name]: val }));
    if (errors[name]) setErrors(e => { const n = { ...e }; delete n[name]; return n; });
  };

  return (
    <div style={cardStyle}>
      <h3 style={sectionTitleStyle}>Create New Trip</h3>
      {successMsg && (
        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'rgba(67,181,104,0.1)', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)', color: 'var(--color-success)', fontSize: 'var(--text-sm)', fontWeight: 600 }} role="status" aria-live="polite">
          ✓ {successMsg}
        </div>
      )}
      {apiError && <ErrorAlert message={apiError} onDismiss={() => setApiError(null)} />}
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <FormField label="Source" id="trip-source" error={errors.source} required>
            <input id="trip-source" type="text" value={form.source} onChange={e => setField('source', e.target.value)} placeholder="e.g. Mumbai Depot" style={inputStyle(!!errors.source)} disabled={pending} />
          </FormField>
          <FormField label="Destination" id="trip-dest" error={errors.destination} required>
            <input id="trip-dest" type="text" value={form.destination} onChange={e => setField('destination', e.target.value)} placeholder="e.g. Pune Hub" style={inputStyle(!!errors.destination)} disabled={pending} />
          </FormField>
          <FormField label="Cargo Weight" id="trip-cargo" error={errors.cargo_weight_kg} required unit="kg">
            <input id="trip-cargo" type="number" min="0.01" step="0.01" value={form.cargo_weight_kg} onChange={e => setField('cargo_weight_kg', e.target.value)} placeholder="450" style={inputStyle(!!errors.cargo_weight_kg)} disabled={pending} />
          </FormField>
          <FormField label="Planned Distance" id="trip-dist" error={errors.planned_distance_km} required unit="km">
            <input id="trip-dist" type="number" min="0.01" step="0.01" value={form.planned_distance_km} onChange={e => setField('planned_distance_km', e.target.value)} placeholder="180" style={inputStyle(!!errors.planned_distance_km)} disabled={pending} />
          </FormField>
          <FormField label="Revenue" id="trip-rev" helpText="Optional – leave blank if not confirmed." unit="₹">
            <input id="trip-rev" type="number" min="0" step="0.01" value={form.revenue} onChange={e => setField('revenue', e.target.value)} placeholder="15000" style={inputStyle()} disabled={pending} />
          </FormField>
        </div>
        <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" style={primaryBtnStyle(pending)} disabled={pending} id="btn-create-trip">
            {pending ? '⏳ Creating…' : '+ Create Draft Trip'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ── DispatchPanel ──────────────────────────────────────────────────────────

interface DispatchPanelProps {
  trip: Trip;
  onDispatched: (trip: Trip, msg: string) => void;
}

const DispatchPanel: React.FC<DispatchPanelProps> = ({ trip, onDispatched }) => {
  const [vehicles, setVehicles] = useState<AvailableVehicle[]>([]);
  const [drivers, setDrivers] = useState<AvailableDriver[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [conflict, setConflict] = useState<EligibilityConflict | null>(null);
  const [pending, setPending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchDispatchOptions()
      .then(({ vehicles: v, drivers: d }) => { setVehicles(v); setDrivers(d); })
      .catch(() => setLoadError('Could not load resources. Refresh to retry.'));
  }, [trip.id]);

  const selectedVehicle = vehicles.find(v => String(v.id) === vehicleId) ?? null;

  const clientConflict: EligibilityConflict | null = selectedVehicle && Number(trip.cargo_weight_kg) > Number(selectedVehicle.max_capacity_kg)
    ? { code: 'CARGO_EXCEEDS_CAPACITY', cargoKg: Number(trip.cargo_weight_kg), capacityKg: Number(selectedVehicle.max_capacity_kg), vehicleReg: selectedVehicle.registration_number }
    : null;

  const displayConflict = conflict ?? clientConflict;
  const canDispatch = vehicleId && driverId && !clientConflict && !pending;
  const today = new Date().toISOString().split('T')[0];

  const handleDispatch = async () => {
    setConflict(null);
    setPending(true);
    try {
      const { trip: updated, message } = await dispatchTrip(trip.id, Number(vehicleId), Number(driverId));
      onDispatched(updated, message);
    } catch (err: any) {
      setConflict({ code: err.code || 'DISPATCH_FAILED', message: err.message || 'Dispatch rejected by server.' });
    } finally {
      setPending(false);
    }
  };

  if (loadError) return <div style={{ padding: 'var(--space-4)', color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>⚠ {loadError}</div>;

  return (
    <div style={panelStyle}>
      <div style={panelLabelStyle}>Dispatch Configuration</div>
      {displayConflict && <DispatchEligibilityNotice conflict={displayConflict} />}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
        <FormField label="Assign Vehicle" id={`v-${trip.id}`}>
          <select id={`v-${trip.id}`} value={vehicleId} onChange={e => { setVehicleId(e.target.value); setConflict(null); }} style={selectStyle()} disabled={pending}>
            <option value="">— Select vehicle —</option>
            {vehicles.map(v => <option key={v.id} value={String(v.id)}>{v.registration_number} — {v.name} ({v.max_capacity_kg} kg)</option>)}
          </select>
          {selectedVehicle && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>Capacity: {selectedVehicle.max_capacity_kg} kg · {selectedVehicle.vehicle_type} · {selectedVehicle.region}</div>}
        </FormField>
        <FormField label="Assign Driver" id={`d-${trip.id}`}>
          <select id={`d-${trip.id}`} value={driverId} onChange={e => { setDriverId(e.target.value); setConflict(null); }} style={selectStyle()} disabled={pending}>
            <option value="">— Select driver —</option>
            {drivers.map(d => {
              const expired = d.licence_expiry_date < today;
              return <option key={d.id} value={String(d.id)} disabled={expired}>{d.full_name} — {d.licence_category}{expired ? ' ⚠ EXPIRED' : ''}</option>;
            })}
          </select>
        </FormField>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <button type="button" id={`btn-dispatch-${trip.id}`} style={primaryBtnStyle(!canDispatch)} disabled={!canDispatch} onClick={handleDispatch} aria-disabled={!canDispatch}>
          {pending ? '⏳ Dispatching…' : '▶ Dispatch Trip'}
        </button>
        {(!vehicleId || !driverId) && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Select vehicle and driver to enable dispatch.</span>}
      </div>
    </div>
  );
};

// ── CompleteTripPanel ──────────────────────────────────────────────────────

interface CompleteTripPanelProps {
  trip: Trip;
  onCompleted: (trip: Trip, msg: string) => void;
  onCancel: () => void;
}

const CompleteTripPanel: React.FC<CompleteTripPanelProps> = ({ trip, onCompleted, onCancel }) => {
  const [actualKm, setActualKm] = useState(String(Number(trip.planned_distance_km).toFixed(1)));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const maxAllowed = Number(trip.planned_distance_km) * 3;

  const handleComplete = async () => {
    setError(null);
    const val = Number(actualKm);
    if (!Number.isFinite(val) || val <= 0) { setError('Enter a positive distance.'); return; }
    if (val > 99999) { setError('Value seems unrealistic (max 99,999 km).'); return; }
    if (val > maxAllowed) { setError(`Distance exceeds 3 times the planned ${Number(trip.planned_distance_km)} km limit (${maxAllowed} km max).`); return; }
    setPending(true);
    try {
      const { trip: updated, message } = await completeTrip(trip.id, val);
      onCompleted(updated, message);
    } catch (err: any) {
      setError(err.message || 'Failed to complete trip.');
    } finally {
      setPending(false);
    }
  };

  const deviation = Number(actualKm) - Number(trip.planned_distance_km);
  const showDeviation = Number(actualKm) > 0 && Number.isFinite(deviation);

  return (
    <div style={panelStyle}>
      <div style={panelLabelStyle}>Record Trip Completion</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', alignItems: 'start', marginBottom: 'var(--space-3)' }}>
        <FormField label="Actual Distance" id={`actual-km-${trip.id}`} error={error ?? undefined} required unit="km"
          helpText={`Planned: ${Number(trip.planned_distance_km).toFixed(1)} km · Max allowed: ${maxAllowed.toFixed(0)} km`}>
          <input
            id={`actual-km-${trip.id}`}
            type="number"
            min="0.01"
            step="0.1"
            max={maxAllowed}
            value={actualKm}
            onChange={e => { setActualKm(e.target.value); setError(null); }}
            style={inputStyle(!!error)}
            disabled={pending}
          />
        </FormField>
        {showDeviation && (
          <div style={{ paddingTop: 'calc(var(--space-4) + 1.25em)', fontSize: 'var(--text-xs)', color: deviation > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
            {deviation > 0 ? `+${deviation.toFixed(1)} km over plan` : deviation < 0 ? `${deviation.toFixed(1)} km under plan` : 'Exactly on plan ✓'}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <button type="button" id={`btn-complete-${trip.id}`} style={primaryBtnStyle(pending)} disabled={pending} onClick={handleComplete}>
          {pending ? '⏳ Completing…' : '✓ Mark as Completed'}
        </button>
        <button type="button" style={ghostBtnStyle()} onClick={onCancel} disabled={pending}>
          Back
        </button>
      </div>
    </div>
  );
};

// ── CancelTripPanel ────────────────────────────────────────────────────────

interface CancelTripPanelProps {
  trip: Trip;
  onCancelled: (trip: Trip, msg: string) => void;
  onBack: () => void;
}

const CancelTripPanel: React.FC<CancelTripPanelProps> = ({ trip, onCancelled, onBack }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleCancel = async () => {
    setError(null);
    setPending(true);
    try {
      const { trip: updated, message } = await cancelTrip(trip.id, reason.trim() || undefined);
      onCancelled(updated, message);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel trip.');
    } finally {
      setPending(false);
    }
  };

  const isDispatched = trip.status === 'DISPATCHED';

  return (
    <div style={{ ...panelStyle, backgroundColor: 'rgba(233,106,106,0.04)' }}>
      <div style={{ ...panelLabelStyle, color: 'var(--color-danger)' }}>Cancel Trip</div>
      {isDispatched && (
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)', padding: 'var(--space-3)', backgroundColor: 'rgba(233,106,106,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-danger)' }}>
          ⚠ This trip is currently <strong>DISPATCHED</strong>. Cancelling will release{trip.vehicle_reg ? ` ${trip.vehicle_reg}` : ' the vehicle'} and{trip.driver_name ? ` ${trip.driver_name}` : ' the driver'} back to Available.
        </div>
      )}
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
      <FormField label="Reason (optional)" id={`cancel-reason-${trip.id}`} helpText="Up to 500 characters.">
        <textarea
          id={`cancel-reason-${trip.id}`}
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="e.g. Customer request, route change…"
          style={{ ...inputStyle(), height: 'auto', padding: 'var(--space-2) var(--space-3)', resize: 'vertical', lineHeight: '1.5' }}
          disabled={pending}
        />
      </FormField>
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
        <button type="button" id={`btn-confirm-cancel-${trip.id}`} style={ghostBtnStyle(true)} disabled={pending} onClick={handleCancel}>
          {pending ? '⏳ Cancelling…' : '✕ Confirm Cancel'}
        </button>
        <button type="button" style={ghostBtnStyle()} onClick={onBack} disabled={pending}>
          Back
        </button>
      </div>
    </div>
  );
};

// ── TripCard ───────────────────────────────────────────────────────────────

type CardPanel = 'none' | 'dispatch' | 'complete' | 'cancel';

interface TripCardProps {
  trip: Trip;
  onUpdated: (trip: Trip, msg: string) => void;
}

const TripCard: React.FC<TripCardProps> = ({ trip, onUpdated }) => {
  const [panel, setPanel] = useState<CardPanel>('none');

  const isDraft = trip.status === 'DRAFT';
  const isDispatched = trip.status === 'DISPATCHED';
  const isTerminal = trip.status === 'COMPLETED' || trip.status === 'CANCELLED';

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-3) var(--space-4)',
    flexWrap: 'wrap',
  };

  const codeStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--text-sm)',
    fontWeight: 700,
    color: 'var(--color-primary)',
    minWidth: '80px',
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: 'var(--space-2)',
    marginLeft: 'auto',
    flexShrink: 0,
  };

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--color-surface)' }}>
      {/* Header row */}
      <div style={headerStyle}>
        <span style={codeStyle}>{trip.trip_code}</span>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', flex: 1, minWidth: '140px' }}>
          {trip.source} → {trip.destination}
        </span>
        <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
          <span>{Number(trip.cargo_weight_kg).toFixed(0)} kg</span>
          <span>{Number(trip.planned_distance_km).toFixed(0)} km planned</span>
          {trip.actual_distance_km != null && <span>{Number(trip.actual_distance_km).toFixed(0)} km actual</span>}
          {trip.vehicle_reg && <span>{trip.vehicle_reg}</span>}
          {trip.driver_name && <span>{trip.driver_name}</span>}
        </div>
        <StatusBadge status={trip.status} />

        {/* Action buttons */}
        {!isTerminal && (
          <div style={actionsStyle}>
            {isDraft && (
              <button
                type="button"
                id={`btn-open-dispatch-${trip.id}`}
                style={panel === 'dispatch' ? primaryBtnStyle() : ghostBtnStyle()}
                onClick={() => setPanel(p => p === 'dispatch' ? 'none' : 'dispatch')}
              >
                {panel === 'dispatch' ? '▲ Close' : '▶ Dispatch'}
              </button>
            )}
            {isDraft && (
              <button type="button" id={`btn-open-cancel-draft-${trip.id}`} style={ghostBtnStyle(true)}
                onClick={() => setPanel(p => p === 'cancel' ? 'none' : 'cancel')}>
                ✕ Cancel
              </button>
            )}
            {isDispatched && (
              <button type="button" id={`btn-open-complete-${trip.id}`} style={panel === 'complete' ? primaryBtnStyle() : ghostBtnStyle()}
                onClick={() => setPanel(p => p === 'complete' ? 'none' : 'complete')}>
                {panel === 'complete' ? '▲ Close' : '✓ Complete'}
              </button>
            )}
            {isDispatched && (
              <button type="button" id={`btn-open-cancel-${trip.id}`} style={ghostBtnStyle(true)}
                onClick={() => setPanel(p => p === 'cancel' ? 'none' : 'cancel')}>
                ✕ Cancel
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lifecycle stepper for terminal/dispatched trips */}
      {!isDraft && (
        <div style={{ padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-hover)' }}>
          <TripLifecycle status={trip.status} tripCode={trip.trip_code} />
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            {trip.dispatched_at && <span>Dispatched: {new Date(trip.dispatched_at).toLocaleString()}</span>}
            {trip.completed_at && <span>Completed: {new Date(trip.completed_at).toLocaleString()}</span>}
          </div>
        </div>
      )}

      {/* Panels */}
      {panel === 'dispatch' && isDraft && (
        <DispatchPanel trip={trip} onDispatched={(t, m) => { onUpdated(t, m); setPanel('none'); }} />
      )}
      {panel === 'complete' && isDispatched && (
        <CompleteTripPanel trip={trip} onCompleted={(t, m) => { onUpdated(t, m); setPanel('none'); }} onCancel={() => setPanel('none')} />
      )}
      {panel === 'cancel' && (isDraft || isDispatched) && (
        <CancelTripPanel trip={trip} onCancelled={(t, m) => { onUpdated(t, m); setPanel('none'); }} onBack={() => setPanel('none')} />
      )}
    </div>
  );
};

// ── TripsPage ──────────────────────────────────────────────────────────────

interface TripsPageProps {
  userRole: string;
}

export const TripsPage: React.FC<TripsPageProps> = ({ userRole }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const isDispatcher = userRole === 'DISPATCHER';

  const loadTrips = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setTrips(await fetchTrips(statusFilter || undefined));
    } catch {
      setLoadError('Failed to load trips. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadTrips(); }, [loadTrips]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleTripCreated = (trip: Trip) => {
    setTrips(prev => [trip, ...prev]);
    showToast(`${trip.trip_code} created as DRAFT.`);
  };

  const handleTripUpdated = (updated: Trip, msg: string) => {
    setTrips(prev => prev.map(t => t.id === updated.id ? updated : t));
    showToast(msg);
  };

  const draftCount = trips.filter(t => t.status === 'DRAFT').length;
  const dispatchedCount = trips.filter(t => t.status === 'DISPATCHED').length;

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
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>Trips &amp; Dispatch</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Plan routes, dispatch trips, complete and cancel assignments.</p>
        </div>
        <button type="button" id="btn-refresh-trips" onClick={loadTrips} style={{ height: 'var(--control-height)', padding: '0 var(--space-4)', background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
          ↻ Refresh
        </button>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        {[
          { label: 'Draft', value: draftCount, color: 'var(--color-text-muted)' },
          { label: 'On Trip', value: dispatchedCount, color: 'var(--color-info)' },
          { label: 'Total', value: trips.length, color: 'var(--color-text)' },
        ].map(chip => (
          <div key={chip.label} style={{ padding: 'var(--space-2) var(--space-4)', backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
            <span style={{ fontWeight: 700, color: chip.color }}>{chip.value}</span>{' '}
            <span style={{ color: 'var(--color-text-muted)' }}>{chip.label}</span>
          </div>
        ))}
      </div>

      {/* Create form */}
      {isDispatcher && <CreateTripForm onCreated={handleTripCreated} />}

      {/* Live Board */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <h3 style={{ ...sectionTitleStyle, marginBottom: 0 }}>Live Dispatch Board</h3>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <label htmlFor="status-filter" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Filter:</label>
            <select id="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...selectStyle(), width: '150px' }}>
              {['', 'DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'].map(s => (
                <option key={s} value={s}>{s || 'All Statuses'}</option>
              ))}
            </select>
          </div>
        </div>

        {loadError && <ErrorAlert message={loadError} onDismiss={() => setLoadError(null)} />}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {[1, 2, 3].map(i => <div key={i} style={{ height: '52px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface-hover)', animation: 'pulse 1.5s ease-in-out infinite' }} />)}
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
            {trips.map(trip => (
              <TripCard key={trip.id} trip={trip} onUpdated={handleTripUpdated} />
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
