import React from 'react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  id: string;
  label: string;
  type: 'select' | 'search';
  options?: FilterOption[];
  placeholder?: string;
  value: string;
}

interface FilterBarProps {
  filters: FilterConfig[];
  onFilterChange: (filterId: string, value: string) => void;
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, onReset }) => {
  const hasActiveFilters = filters.some(f => f.value !== '');

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 'var(--space-3)',
    flexWrap: 'wrap',
    marginBottom: 'var(--space-4)',
  };

  const fieldStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
    minWidth: '160px',
    flex: '1 1 160px',
    maxWidth: '240px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  const controlStyle: React.CSSProperties = {
    height: 'var(--control-height)',
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    padding: '0 var(--space-3)',
    color: 'var(--color-text)',
    fontSize: 'var(--text-sm)',
    outline: 'none',
    width: '100%',
  };

  const resetStyle: React.CSSProperties = {
    height: 'var(--control-height)',
    padding: '0 var(--space-4)',
    backgroundColor: 'transparent',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--color-text-muted)',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    cursor: hasActiveFilters ? 'pointer' : 'default',
    opacity: hasActiveFilters ? 1 : 0.4,
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };

  return (
    <div style={containerStyle}>
      {filters.map(filter => (
        <div key={filter.id} style={fieldStyle}>
          <label htmlFor={`filter-${filter.id}`} style={labelStyle}>{filter.label}</label>
          {filter.type === 'search' ? (
            <input
              id={`filter-${filter.id}`}
              type="text"
              value={filter.value}
              onChange={e => onFilterChange(filter.id, e.target.value)}
              placeholder={filter.placeholder || 'Search...'}
              style={controlStyle}
            />
          ) : (
            <select
              id={`filter-${filter.id}`}
              value={filter.value}
              onChange={e => onFilterChange(filter.id, e.target.value)}
              style={{ ...controlStyle, cursor: 'pointer', appearance: 'auto' }}
            >
              <option value="">All</option>
              {filter.options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
        </div>
      ))}
      <button
        type="button"
        style={resetStyle}
        onClick={onReset}
        disabled={!hasActiveFilters}
        onMouseEnter={e => { if (hasActiveFilters) e.currentTarget.style.color = 'var(--color-text)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
      >
        Reset Filters
      </button>
    </div>
  );
};
