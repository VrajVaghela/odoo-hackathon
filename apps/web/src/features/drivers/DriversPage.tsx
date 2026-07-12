import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../../components/PageHeader.tsx';
import { DataTable, Column } from '../../components/DataTable.tsx';
import { FilterBar, FilterConfig } from '../../components/FilterBar.tsx';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import { FormField } from '../../components/FormField.tsx';
import { ErrorAlert } from '../../components/ErrorAlert.tsx';
import { fetchDrivers, createDriver, Driver } from './driversApi.ts';

interface DriversPageProps {
  userRole: string;
}

type FormMode = 'closed' | 'add' | 'edit';

interface DriverForm {
  full_name: string;
  licence_number: string;
  licence_category: string;
  licence_expiry_date: string;
  contact_number: string;
  safety_score: string;
}

const emptyForm: DriverForm = {
  full_name: '',
  licence_number: '',
  licence_category: 'LIGHT',
  licence_expiry_date: '',
  contact_number: '',
  safety_score: '100',
};

/** Check if a licence expiry date is expired */
function isExpired(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

/** Check if a licence is expiring within 90 days */
function isNearExpiry(dateStr: string): boolean {
  const expiry = new Date(dateStr);
  const now = new Date();
  const daysUntil = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return daysUntil > 0 && daysUntil <= 90;
}

/** Safety score colour */
function safetyScoreColor(score: number): string {
  if (score >= 80) return 'var(--color-success)';
  if (score >= 50) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

export const DriversPage: React.FC<DriversPageProps> = ({ userRole: _userRole }) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  // Form
  const [formMode, setFormMode] = useState<FormMode>('closed');
  const [form, setForm] = useState<DriverForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof DriverForm, string>>>({});
  const [formApiError, setFormApiError] = useState<string | null>(null);
  const [formPending, setFormPending] = useState(false);

  const filters: FilterConfig[] = [
    {
      id: 'search', label: 'Search', type: 'search', value: filterSearch,
      placeholder: 'Name or licence...',
    },
    {
      id: 'status', label: 'Status', type: 'select', value: filterStatus,
      options: [
        { value: 'AVAILABLE', label: 'Available' },
        { value: 'ON_TRIP', label: 'On Trip' },
        { value: 'OFF_DUTY', label: 'Off Duty' },
        { value: 'SUSPENDED', label: 'Suspended' },
      ],
    },
    {
      id: 'category', label: 'Licence Category', type: 'select', value: filterCategory,
      options: [
        { value: 'LIGHT', label: 'Light' },
        { value: 'HEAVY', label: 'Heavy' },
      ],
    },
  ];

  const loadDrivers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDrivers({
        status: filterStatus || undefined,
        licence_category: filterCategory || undefined,
        search: filterSearch || undefined,
      });
      setDrivers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load drivers.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCategory, filterSearch]);

  useEffect(() => { loadDrivers(); }, [loadDrivers]);

  const handleFilterChange = (id: string, value: string) => {
    if (id === 'status') setFilterStatus(value);
    if (id === 'category') setFilterCategory(value);
    if (id === 'search') setFilterSearch(value);
  };

  const handleResetFilters = () => {
    setFilterStatus('');
    setFilterCategory('');
    setFilterSearch('');
  };

  // Client-side search fallback
  const filteredDrivers = drivers.filter(d => {
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      return (
        d.full_name.toLowerCase().includes(q) ||
        d.licence_number.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Form
  const openAddForm = () => {
    setForm(emptyForm);
    setFormErrors({});
    setFormApiError(null);
    setFormMode('add');
  };

  const validateForm = (): boolean => {
    const errs: Partial<Record<keyof DriverForm, string>> = {};
    if (!form.full_name.trim()) errs.full_name = 'Name is required';
    if (!form.licence_number.trim()) errs.licence_number = 'Licence number is required';
    if (!form.licence_expiry_date) errs.licence_expiry_date = 'Expiry date is required';
    if (!form.contact_number.trim()) errs.contact_number = 'Contact number is required';
    const score = Number(form.safety_score);
    if (isNaN(score) || score < 0 || score > 100) errs.safety_score = 'Score must be 0–100';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormPending(true);
    setFormApiError(null);
    try {
      await createDriver({
        full_name: form.full_name.trim(),
        licence_number: form.licence_number.trim(),
        licence_category: form.licence_category,
        licence_expiry_date: form.licence_expiry_date,
        contact_number: form.contact_number.trim(),
        safety_score: Number(form.safety_score),
      });
      setFormMode('closed');
      await loadDrivers();
    } catch (err: any) {
      setFormApiError(err.message || 'Failed to save driver.');
    } finally {
      setFormPending(false);
    }
  };

  const updateFormField = (field: keyof DriverForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

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

  // Compliance badge
  const ComplianceBadge: React.FC<{ driver: Driver }> = ({ driver }) => {
    if (driver.status === 'SUSPENDED') {
      return (
        <span style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 700,
          color: 'var(--color-danger)',
          backgroundColor: 'rgba(233, 106, 106, 0.15)',
          padding: '2px var(--space-2)',
          borderRadius: 'var(--radius-sm)',
        }}>
          SUSPENDED
        </span>
      );
    }
    if (isExpired(driver.licence_expiry_date)) {
      return (
        <span style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 700,
          color: 'var(--color-danger)',
          backgroundColor: 'rgba(233, 106, 106, 0.15)',
          padding: '2px var(--space-2)',
          borderRadius: 'var(--radius-sm)',
        }}>
          EXPIRED
        </span>
      );
    }
    if (isNearExpiry(driver.licence_expiry_date)) {
      return (
        <span style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 700,
          color: 'var(--color-warning)',
          backgroundColor: 'rgba(240, 161, 26, 0.15)',
          padding: '2px var(--space-2)',
          borderRadius: 'var(--radius-sm)',
        }}>
          EXPIRING SOON
        </span>
      );
    }
    return (
      <span style={{
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        color: 'var(--color-success)',
      }}>
        Valid
      </span>
    );
  };

  const columns: Column<Driver>[] = [
    {
      key: 'full_name',
      header: 'Driver',
      render: (d) => <span style={{ fontWeight: 700 }}>{d.full_name}</span>,
    },
    {
      key: 'licence_number',
      header: 'Licence #',
      render: (d) => (
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-info)' }}>
          {d.licence_number}
        </span>
      ),
    },
    { key: 'licence_category', header: 'Category' },
    {
      key: 'licence_expiry_date',
      header: 'Expiry',
      render: (d) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span className="tabular-nums" style={{
            color: isExpired(d.licence_expiry_date) ? 'var(--color-danger)' : 'var(--color-text)',
          }}>
            {d.licence_expiry_date}
          </span>
          <ComplianceBadge driver={d} />
        </div>
      ),
    },
    { key: 'contact_number', header: 'Contact' },
    {
      key: 'safety_score',
      header: 'Safety',
      align: 'center',
      render: (d) => {
        const score = Number(d.safety_score);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', justifyContent: 'center' }}>
            {/* Mini bar */}
            <div style={{
              width: '48px',
              height: '6px',
              backgroundColor: 'var(--color-surface)',
              borderRadius: '3px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${score}%`,
                height: '100%',
                backgroundColor: safetyScoreColor(score),
                borderRadius: '3px',
                transition: 'width 0.3s ease',
              }} />
            </div>
            <span className="tabular-nums" style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              color: safetyScoreColor(score),
            }}>
              {score}
            </span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (d) => <StatusBadge status={d.status} />,
    },
  ];

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <PageHeader
        title="Drivers & Safety Profiles"
        description="Track driver licenses, safety scores, and compliance status."
        actions={
          <button
            type="button"
            style={addBtnStyle}
            onClick={openAddForm}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-primary)'; }}
          >
            + Add Driver
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
        data={filteredDrivers}
        keyField="id"
        loading={loading}
        emptyIcon="👤"
        emptyTitle="No drivers found"
        emptyDescription={
          filterSearch || filterStatus || filterCategory
            ? 'Try adjusting your filters.'
            : 'Add your first driver to get started.'
        }
      />

      {/* Add Driver Modal */}
      {formMode !== 'closed' && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--space-4)',
          }}
          onClick={() => setFormMode('closed')}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '520px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: 'var(--shadow-panel)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: 'var(--space-5)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                {formMode === 'add' ? 'Register New Driver' : 'Edit Driver'}
              </h3>

              {formApiError && (
                <ErrorAlert message={formApiError} onDismiss={() => setFormApiError(null)} />
              )}

              <form onSubmit={handleFormSubmit} noValidate>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 var(--space-4)' }}>
                  <FormField label="Full Name" id="fname" error={formErrors.full_name} required>
                    <input
                      id="fname"
                      value={form.full_name}
                      onChange={e => updateFormField('full_name', e.target.value)}
                      placeholder="John Doe"
                      style={inputStyle(!!formErrors.full_name)}
                      disabled={formPending}
                    />
                  </FormField>

                  <FormField label="Licence Number" id="licence" error={formErrors.licence_number} required>
                    <input
                      id="licence"
                      value={form.licence_number}
                      onChange={e => updateFormField('licence_number', e.target.value)}
                      placeholder="DL-XXXXX"
                      style={inputStyle(!!formErrors.licence_number)}
                      disabled={formPending || formMode === 'edit'}
                    />
                  </FormField>

                  <FormField label="Licence Category" id="lcat">
                    <select
                      id="lcat"
                      value={form.licence_category}
                      onChange={e => updateFormField('licence_category', e.target.value)}
                      style={{ ...inputStyle(false), cursor: 'pointer', appearance: 'auto' }}
                      disabled={formPending}
                    >
                      <option value="LIGHT">Light</option>
                      <option value="HEAVY">Heavy</option>
                    </select>
                  </FormField>

                  <FormField label="Expiry Date" id="expiry" error={formErrors.licence_expiry_date} required>
                    <input
                      id="expiry"
                      type="date"
                      value={form.licence_expiry_date}
                      onChange={e => updateFormField('licence_expiry_date', e.target.value)}
                      style={{ ...inputStyle(!!formErrors.licence_expiry_date), colorScheme: 'dark' }}
                      disabled={formPending}
                    />
                  </FormField>

                  <FormField label="Contact Number" id="contact" error={formErrors.contact_number} required>
                    <input
                      id="contact"
                      value={form.contact_number}
                      onChange={e => updateFormField('contact_number', e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      style={inputStyle(!!formErrors.contact_number)}
                      disabled={formPending}
                    />
                  </FormField>

                  <FormField label="Safety Score" id="score" error={formErrors.safety_score} unit="0–100">
                    <input
                      id="score"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={form.safety_score}
                      onChange={e => updateFormField('safety_score', e.target.value)}
                      style={inputStyle(!!formErrors.safety_score)}
                      disabled={formPending}
                    />
                  </FormField>
                </div>

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
                    {formPending ? 'Saving...' : 'Register Driver'}
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
