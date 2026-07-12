import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../../components/PageHeader.tsx';
import { DataTable, Column } from '../../components/DataTable.tsx';
import { FilterBar, FilterConfig } from '../../components/FilterBar.tsx';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import { FormField } from '../../components/FormField.tsx';
import { ErrorAlert } from '../../components/ErrorAlert.tsx';

import { fetchVehicles, createVehicle, Vehicle } from './vehiclesApi.ts';

interface VehiclesPageProps {
  userRole: string;
}

type FormMode = 'closed' | 'add' | 'edit';

interface VehicleForm {
  registration_number: string;
  name: string;
  model: string;
  vehicle_type: string;
  max_capacity_kg: string;
  odometer_km: string;
  acquisition_cost: string;
  region: string;
}

const emptyForm: VehicleForm = {
  registration_number: '',
  name: '',
  model: '',
  vehicle_type: 'VAN',
  max_capacity_kg: '',
  odometer_km: '0',
  acquisition_cost: '',
  region: '',
};

export const VehiclesPage: React.FC<VehiclesPageProps> = ({ userRole: _userRole }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  // Form
  const [formMode, setFormMode] = useState<FormMode>('closed');
  const [form, setForm] = useState<VehicleForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof VehicleForm, string>>>({});
  const [formApiError, setFormApiError] = useState<string | null>(null);
  const [formPending, setFormPending] = useState(false);
  const [_editingId, setEditingId] = useState<number | null>(null);

  const filters: FilterConfig[] = [
    {
      id: 'search', label: 'Search', type: 'search', value: filterSearch,
      placeholder: 'Registration or name...',
    },
    {
      id: 'status', label: 'Status', type: 'select', value: filterStatus,
      options: [
        { value: 'AVAILABLE', label: 'Available' },
        { value: 'ON_TRIP', label: 'On Trip' },
        { value: 'IN_SHOP', label: 'In Shop' },
        { value: 'RETIRED', label: 'Retired' },
      ],
    },
    {
      id: 'type', label: 'Type', type: 'select', value: filterType,
      options: [
        { value: 'VAN', label: 'Van' },
        { value: 'TRUCK', label: 'Truck' },
      ],
    },
    {
      id: 'region', label: 'Region', type: 'select', value: filterRegion,
      options: [
        { value: 'North', label: 'North' },
        { value: 'South', label: 'South' },
        { value: 'East', label: 'East' },
        { value: 'West', label: 'West' },
      ],
    },
  ];

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVehicles({
        status: filterStatus || undefined,
        vehicle_type: filterType || undefined,
        region: filterRegion || undefined,
        search: filterSearch || undefined,
      });
      setVehicles(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load vehicles.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType, filterRegion, filterSearch]);

  useEffect(() => { loadVehicles(); }, [loadVehicles]);

  const handleFilterChange = (id: string, value: string) => {
    if (id === 'status') setFilterStatus(value);
    if (id === 'type') setFilterType(value);
    if (id === 'region') setFilterRegion(value);
    if (id === 'search') setFilterSearch(value);
  };

  const handleResetFilters = () => {
    setFilterStatus('');
    setFilterType('');
    setFilterRegion('');
    setFilterSearch('');
  };

  // Client-side filter for search (API placeholder may not support it)
  const filteredVehicles = vehicles.filter(v => {
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      return (
        v.registration_number.toLowerCase().includes(q) ||
        v.name.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Form handling
  const openAddForm = () => {
    setForm(emptyForm);
    setFormErrors({});
    setFormApiError(null);
    setFormMode('add');
    setEditingId(null);
  };

  const openEditForm = (vehicle: Vehicle) => {
    setForm({
      registration_number: vehicle.registration_number,
      name: vehicle.name,
      model: vehicle.model,
      vehicle_type: vehicle.vehicle_type,
      max_capacity_kg: String(vehicle.max_capacity_kg),
      odometer_km: String(vehicle.odometer_km),
      acquisition_cost: String(vehicle.acquisition_cost),
      region: vehicle.region,
    });
    setFormErrors({});
    setFormApiError(null);
    setFormMode('edit');
    setEditingId(vehicle.id);
  };

  const validateForm = (): boolean => {
    const errs: Partial<Record<keyof VehicleForm, string>> = {};
    if (!form.registration_number.trim()) errs.registration_number = 'Registration number is required';
    if (!form.name.trim()) errs.name = 'Vehicle name is required';
    if (!form.model.trim()) errs.model = 'Model is required';
    if (!form.max_capacity_kg || Number(form.max_capacity_kg) <= 0) errs.max_capacity_kg = 'Capacity must be positive';
    if (!form.acquisition_cost || Number(form.acquisition_cost) < 0) errs.acquisition_cost = 'Cost must be non-negative';
    if (!form.region.trim()) errs.region = 'Region is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormPending(true);
    setFormApiError(null);
    try {
      await createVehicle({
        registration_number: form.registration_number.trim(),
        name: form.name.trim(),
        model: form.model.trim(),
        vehicle_type: form.vehicle_type,
        max_capacity_kg: Number(form.max_capacity_kg),
        odometer_km: Number(form.odometer_km || 0),
        acquisition_cost: Number(form.acquisition_cost),
        region: form.region.trim(),
      });
      setFormMode('closed');
      await loadVehicles();
    } catch (err: any) {
      setFormApiError(err.message || 'Failed to save vehicle.');
    } finally {
      setFormPending(false);
    }
  };

  const updateFormField = (field: keyof VehicleForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Input style helper
  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%',
    height: 'var(--control-height)',
    backgroundColor: 'var(--color-surface)',
    border: `1px solid ${hasError ? 'var(--color-danger)' : 'var(--color-border)'}`,
    borderRadius: 'var(--radius-sm)',
    padding: '0 var(--space-3)',
    color: 'var(--color-text)',
    fontSize: 'var(--text-sm)',
    outline: 'none',
  });

  // Table columns
  const columns: Column<Vehicle>[] = [
    {
      key: 'registration_number',
      header: 'Reg #',
      render: (v) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-info)' }}>
          {v.registration_number}
        </span>
      ),
    },
    { key: 'name', header: 'Name' },
    { key: 'model', header: 'Model' },
    { key: 'vehicle_type', header: 'Type' },
    {
      key: 'max_capacity_kg',
      header: 'Capacity',
      align: 'right',
      render: (v) => <span className="tabular-nums">{v.max_capacity_kg} kg</span>,
    },
    {
      key: 'odometer_km',
      header: 'Odometer',
      align: 'right',
      render: (v) => <span className="tabular-nums">{Number(v.odometer_km).toLocaleString()} km</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (v) => <StatusBadge status={v.status} />,
    },
    { key: 'region', header: 'Region' },
    {
      key: 'acquisition_cost',
      header: 'Cost',
      align: 'right',
      render: (v) => <span className="tabular-nums">₹{Number(v.acquisition_cost).toLocaleString()}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (v) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); openEditForm(v); }}
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
            padding: 'var(--space-1) var(--space-2)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-xs)',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Edit
        </button>
      ),
    },
  ];

  // Styles
  const addBtnStyle: React.CSSProperties = {
    height: 'var(--control-height)',
    padding: '0 var(--space-5)',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-primary-contrast)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-sm)',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background-color 0.2s',
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 'var(--space-4)',
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-surface-raised)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    maxWidth: '560px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: 'var(--shadow-panel)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <PageHeader
        title="Fleet Registry"
        description="Manage fleet assets, configurations, and lifecycle status."
        actions={
          <button
            type="button"
            style={addBtnStyle}
            onClick={openAddForm}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-primary)'; }}
          >
            + Add Vehicle
          </button>
        }
      />

      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <DataTable
        columns={columns}
        data={filteredVehicles}
        keyField="id"
        loading={loading}
        emptyIcon="🚗"
        emptyTitle="No vehicles found"
        emptyDescription={
          filterSearch || filterStatus || filterType || filterRegion
            ? 'Try adjusting your filters.'
            : 'Register your first vehicle to get started.'
        }
      />

      {/* Add/Edit Modal */}
      {formMode !== 'closed' && (
        <div style={overlayStyle} onClick={() => setFormMode('closed')}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ padding: 'var(--space-5)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                {formMode === 'add' ? 'Register New Vehicle' : 'Edit Vehicle'}
              </h3>

              {formApiError && (
                <ErrorAlert message={formApiError} onDismiss={() => setFormApiError(null)} />
              )}

              <form onSubmit={handleFormSubmit} noValidate>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 var(--space-4)' }}>
                  <FormField label="Registration Number" id="reg" error={formErrors.registration_number} required>
                    <input
                      id="reg"
                      value={form.registration_number}
                      onChange={e => updateFormField('registration_number', e.target.value)}
                      placeholder="KA-01-XX-0000"
                      style={inputStyle(!!formErrors.registration_number)}
                      disabled={formPending || formMode === 'edit'}
                    />
                  </FormField>

                  <FormField label="Vehicle Name" id="vname" error={formErrors.name} required>
                    <input
                      id="vname"
                      value={form.name}
                      onChange={e => updateFormField('name', e.target.value)}
                      placeholder="e.g. Rapid Cargo Van 1"
                      style={inputStyle(!!formErrors.name)}
                      disabled={formPending}
                    />
                  </FormField>

                  <FormField label="Model" id="model" error={formErrors.model} required>
                    <input
                      id="model"
                      value={form.model}
                      onChange={e => updateFormField('model', e.target.value)}
                      placeholder="e.g. Tata Winger"
                      style={inputStyle(!!formErrors.model)}
                      disabled={formPending}
                    />
                  </FormField>

                  <FormField label="Vehicle Type" id="vtype" error={formErrors.vehicle_type}>
                    <select
                      id="vtype"
                      value={form.vehicle_type}
                      onChange={e => updateFormField('vehicle_type', e.target.value)}
                      style={{ ...inputStyle(false), cursor: 'pointer', appearance: 'auto' }}
                      disabled={formPending}
                    >
                      <option value="VAN">Van</option>
                      <option value="TRUCK">Truck</option>
                    </select>
                  </FormField>

                  <FormField label="Max Capacity" id="capacity" error={formErrors.max_capacity_kg} unit="kg" required>
                    <input
                      id="capacity"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.max_capacity_kg}
                      onChange={e => updateFormField('max_capacity_kg', e.target.value)}
                      placeholder="500"
                      style={inputStyle(!!formErrors.max_capacity_kg)}
                      disabled={formPending}
                    />
                  </FormField>

                  <FormField label="Odometer" id="odometer" unit="km">
                    <input
                      id="odometer"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.odometer_km}
                      onChange={e => updateFormField('odometer_km', e.target.value)}
                      placeholder="0"
                      style={inputStyle(false)}
                      disabled={formPending}
                    />
                  </FormField>

                  <FormField label="Acquisition Cost" id="cost" error={formErrors.acquisition_cost} unit="INR" required>
                    <input
                      id="cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.acquisition_cost}
                      onChange={e => updateFormField('acquisition_cost', e.target.value)}
                      placeholder="15000"
                      style={inputStyle(!!formErrors.acquisition_cost)}
                      disabled={formPending}
                    />
                  </FormField>

                  <FormField label="Region" id="region" error={formErrors.region} required>
                    <select
                      id="region"
                      value={form.region}
                      onChange={e => updateFormField('region', e.target.value)}
                      style={{ ...inputStyle(!!formErrors.region), cursor: 'pointer', appearance: 'auto' }}
                      disabled={formPending}
                    >
                      <option value="">Select region</option>
                      <option value="North">North</option>
                      <option value="South">South</option>
                      <option value="East">East</option>
                      <option value="West">West</option>
                    </select>
                  </FormField>
                </div>

                {/* Footer */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 'var(--space-3)',
                  marginTop: 'var(--space-4)',
                  paddingTop: 'var(--space-4)',
                  borderTop: '1px solid var(--color-border)',
                }}>
                  <button
                    type="button"
                    onClick={() => setFormMode('closed')}
                    disabled={formPending}
                    style={{
                      height: 'var(--control-height)',
                      padding: '0 var(--space-4)',
                      background: 'none',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-text)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formPending}
                    style={{
                      ...addBtnStyle,
                      cursor: formPending ? 'not-allowed' : 'pointer',
                      opacity: formPending ? 0.7 : 1,
                    }}
                  >
                    {formPending ? 'Saving...' : formMode === 'add' ? 'Register Vehicle' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
