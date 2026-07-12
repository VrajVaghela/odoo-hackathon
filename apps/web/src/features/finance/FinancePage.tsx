import React, { useCallback, useEffect, useState } from 'react';
import { DataTable, Column } from '../../components/DataTable.tsx';
import { ErrorAlert } from '../../components/ErrorAlert.tsx';
import { FormField } from '../../components/FormField.tsx';
import { LoadingState } from '../../components/LoadingState.tsx';
import { PageHeader } from '../../components/PageHeader.tsx';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import { Expense, FinanceTripOption, FinanceVehicleOption, FuelLog, createExpense, createFuelLog, fetchExpenses, fetchFinanceOptions, fetchFuelLogs } from './financeApi.ts';

const controlStyle: React.CSSProperties = {
  width: '100%', height: 'var(--control-height)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '0 var(--space-3)', color: 'var(--color-text)', fontSize: 'var(--text-sm)',
};
const panelStyle: React.CSSProperties = { backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' };
const money = (value: number) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export const FinancePage: React.FC = () => {
  const [vehicles, setVehicles] = useState<FinanceVehicleOption[]>([]);
  const [trips, setTrips] = useState<FinanceTripOption[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<'fuel' | 'expense' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [fuel, setFuel] = useState({ vehicle_id: '', trip_id: '', logged_at: new Date().toISOString().slice(0, 16), liters: '', cost: '', odometer_km: '' });
  const [expense, setExpense] = useState({ vehicle_id: '', trip_id: '', category: 'TOLL' as Expense['category'], amount: '', occurred_at: new Date().toISOString().slice(0, 16), note: '' });

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [options, loadedFuelLogs, loadedExpenses] = await Promise.all([fetchFinanceOptions(), fetchFuelLogs(), fetchExpenses()]);
      setVehicles(options.vehicles); setTrips(options.trips); setFuelLogs(loadedFuelLogs); setExpenses(loadedExpenses);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load the finance ledger.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const submitFuel = async (event: React.FormEvent) => {
    event.preventDefault(); setError(null); setNotice(null);
    if (!fuel.vehicle_id || !fuel.liters || !fuel.cost || !fuel.odometer_km) { setError('Vehicle, liters, cost, and odometer are required.'); return; }
    setPending('fuel');
    try {
      await createFuelLog({ vehicle_id: Number(fuel.vehicle_id), ...(fuel.trip_id ? { trip_id: Number(fuel.trip_id) } : {}), logged_at: new Date(fuel.logged_at).toISOString(), liters: Number(fuel.liters), cost: Number(fuel.cost), odometer_km: Number(fuel.odometer_km) });
      setFuel({ vehicle_id: '', trip_id: '', logged_at: new Date().toISOString().slice(0, 16), liters: '', cost: '', odometer_km: '' });
      setNotice('Fuel log saved. Operational costs are refreshed from MySQL.'); await load();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Could not save the fuel log.'); } finally { setPending(null); }
  };

  const submitExpense = async (event: React.FormEvent) => {
    event.preventDefault(); setError(null); setNotice(null);
    if ((!expense.vehicle_id && !expense.trip_id) || !expense.amount) { setError('Link the expense to a vehicle or trip and enter an amount.'); return; }
    setPending('expense');
    try {
      await createExpense({ ...(expense.vehicle_id ? { vehicle_id: Number(expense.vehicle_id) } : {}), ...(expense.trip_id ? { trip_id: Number(expense.trip_id) } : {}), category: expense.category, amount: Number(expense.amount), occurred_at: new Date(expense.occurred_at).toISOString(), ...(expense.note.trim() ? { note: expense.note.trim() } : {}) });
      setExpense({ vehicle_id: '', trip_id: '', category: 'TOLL', amount: '', occurred_at: new Date().toISOString().slice(0, 16), note: '' });
      setNotice('Expense saved. Operational costs are refreshed from MySQL.'); await load();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Could not save the expense.'); } finally { setPending(null); }
  };

  const fuelColumns: Column<FuelLog>[] = [
    { key: 'vehicle_registration_number', header: 'Vehicle', render: (row) => <span style={{ fontFamily: 'var(--font-mono)' }}>{row.vehicle_registration_number}</span> },
    { key: 'liters', header: 'Liters', align: 'right', render: (row) => `${row.liters} L` },
    { key: 'cost', header: 'Cost', align: 'right', render: (row) => money(row.cost) },
    { key: 'trip_code', header: 'Trip', render: (row) => row.trip_code || '—' },
    { key: 'logged_at', header: 'Logged', render: (row) => new Date(row.logged_at).toLocaleDateString() },
  ];
  const expenseColumns: Column<Expense>[] = [
    { key: 'category', header: 'Category', render: (row) => <StatusBadge status={row.category} /> },
    { key: 'amount', header: 'Amount', align: 'right', render: (row) => money(row.amount) },
    { key: 'vehicle_registration_number', header: 'Vehicle', render: (row) => row.vehicle_registration_number || '—' },
    { key: 'trip_code', header: 'Trip', render: (row) => row.trip_code || '—' },
    { key: 'occurred_at', header: 'Date', render: (row) => new Date(row.occurred_at).toLocaleDateString() },
  ];

  if (loading) return <LoadingState variant="cards" rows={4} />;
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
    <PageHeader title="Fuel & Expense Ledger" description="Record costs against real vehicles and trips. Every entry updates analytics from MySQL." />
    {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
    {notice && <div role="status" aria-live="polite" style={{ padding: 'var(--space-3)', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-sm)', color: 'var(--color-success)' }}>{notice}</div>}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))', gap: 'var(--space-4)' }}>
      <form style={panelStyle} onSubmit={submitFuel} noValidate>
        <h3 style={{ marginTop: 0, fontSize: 'var(--text-lg)' }}>Log Fuel</h3>
        <FormField label="Vehicle" id="fuel-vehicle" required><select id="fuel-vehicle" value={fuel.vehicle_id} onChange={(event) => setFuel({ ...fuel, vehicle_id: event.target.value })} style={controlStyle} disabled={pending !== null}><option value="">Select vehicle</option>{vehicles.map((vehicle) => <option value={vehicle.id} key={vehicle.id}>{vehicle.registration_number} — {vehicle.name}</option>)}</select></FormField>
        <FormField label="Trip (optional)" id="fuel-trip"><select id="fuel-trip" value={fuel.trip_id} onChange={(event) => setFuel({ ...fuel, trip_id: event.target.value })} style={controlStyle} disabled={pending !== null}><option value="">No linked trip</option>{trips.map((trip) => <option value={trip.id} key={trip.id}>{trip.trip_code} ({trip.status})</option>)}</select></FormField>
        <FormField label="Liters" id="fuel-liters" unit="L" required><input id="fuel-liters" type="number" min="0.01" step="0.01" value={fuel.liters} onChange={(event) => setFuel({ ...fuel, liters: event.target.value })} style={controlStyle} disabled={pending !== null} /></FormField>
        <FormField label="Cost" id="fuel-cost" unit="INR" required><input id="fuel-cost" type="number" min="0.01" step="0.01" value={fuel.cost} onChange={(event) => setFuel({ ...fuel, cost: event.target.value })} style={controlStyle} disabled={pending !== null} /></FormField>
        <FormField label="Odometer" id="fuel-odometer" unit="km" required><input id="fuel-odometer" type="number" min="0" step="0.01" value={fuel.odometer_km} onChange={(event) => setFuel({ ...fuel, odometer_km: event.target.value })} style={controlStyle} disabled={pending !== null} /></FormField>
        <FormField label="Logged at" id="fuel-date" required><input id="fuel-date" type="datetime-local" value={fuel.logged_at} onChange={(event) => setFuel({ ...fuel, logged_at: event.target.value })} style={controlStyle} disabled={pending !== null} /></FormField>
        <button type="submit" disabled={pending !== null} style={{ ...controlStyle, backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-contrast)', border: 'none', cursor: pending ? 'not-allowed' : 'pointer', fontWeight: 700 }}>{pending === 'fuel' ? 'Saving…' : 'Save Fuel Log'}</button>
      </form>
      <form style={panelStyle} onSubmit={submitExpense} noValidate>
        <h3 style={{ marginTop: 0, fontSize: 'var(--text-lg)' }}>Log Expense</h3>
        <FormField label="Vehicle (optional)" id="expense-vehicle"><select id="expense-vehicle" value={expense.vehicle_id} onChange={(event) => setExpense({ ...expense, vehicle_id: event.target.value })} style={controlStyle} disabled={pending !== null}><option value="">No vehicle</option>{vehicles.map((vehicle) => <option value={vehicle.id} key={vehicle.id}>{vehicle.registration_number}</option>)}</select></FormField>
        <FormField label="Trip (optional)" id="expense-trip"><select id="expense-trip" value={expense.trip_id} onChange={(event) => setExpense({ ...expense, trip_id: event.target.value })} style={controlStyle} disabled={pending !== null}><option value="">No trip</option>{trips.map((trip) => <option value={trip.id} key={trip.id}>{trip.trip_code}</option>)}</select></FormField>
        <FormField label="Category" id="expense-category" required><select id="expense-category" value={expense.category} onChange={(event) => setExpense({ ...expense, category: event.target.value as Expense['category'] })} style={controlStyle} disabled={pending !== null}>{(['TOLL', 'PARKING', 'OTHER', 'MAINTENANCE_ADJUSTMENT'] as const).map((category) => <option key={category}>{category}</option>)}</select></FormField>
        <FormField label="Amount" id="expense-amount" unit="INR" required><input id="expense-amount" type="number" min="0.01" step="0.01" value={expense.amount} onChange={(event) => setExpense({ ...expense, amount: event.target.value })} style={controlStyle} disabled={pending !== null} /></FormField>
        <FormField label="Occurred at" id="expense-date" required><input id="expense-date" type="datetime-local" value={expense.occurred_at} onChange={(event) => setExpense({ ...expense, occurred_at: event.target.value })} style={controlStyle} disabled={pending !== null} /></FormField>
        <FormField label="Note" id="expense-note"><input id="expense-note" value={expense.note} onChange={(event) => setExpense({ ...expense, note: event.target.value })} style={controlStyle} disabled={pending !== null} /></FormField>
        <button type="submit" disabled={pending !== null} style={{ ...controlStyle, backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-contrast)', border: 'none', cursor: pending ? 'not-allowed' : 'pointer', fontWeight: 700 }}>{pending === 'expense' ? 'Saving…' : 'Save Expense'}</button>
      </form>
    </div>
    <section style={panelStyle}><h3 style={{ marginTop: 0, fontSize: 'var(--text-lg)' }}>Fuel Logs</h3><DataTable columns={fuelColumns} data={fuelLogs} keyField="id" emptyTitle="No fuel logs" emptyDescription="Fuel entries will appear here after they are saved." /></section>
    <section style={panelStyle}><h3 style={{ marginTop: 0, fontSize: 'var(--text-lg)' }}>Other Expenses</h3><DataTable columns={expenseColumns} data={expenses} keyField="id" emptyTitle="No expenses" emptyDescription="Tolls, parking, and adjustments will appear here." /></section>
  </div>;
};
