import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  loading?: boolean;
  emptyIcon?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  keyField,
  loading = false,
  emptyIcon = '📋',
  emptyTitle = 'No records found',
  emptyDescription,
  onRowClick,
}: DataTableProps<T>) {
  const wrapperStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-surface-raised)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
  };

  const scrollStyle: React.CSSProperties = {
    overflowX: 'auto',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 'var(--text-sm)',
  };

  const thStyle = (col: Column<T>): React.CSSProperties => ({
    padding: 'var(--space-3) var(--space-4)',
    textAlign: (col.align || 'left') as React.CSSProperties['textAlign'],
    fontSize: 'var(--text-xs)',
    fontWeight: 700,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    backgroundColor: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)',
    whiteSpace: 'nowrap',
    width: col.width,
  });

  const tdStyle = (col: Column<T>): React.CSSProperties => ({
    padding: 'var(--space-3) var(--space-4)',
    textAlign: (col.align || 'left') as React.CSSProperties['textAlign'],
    borderBottom: '1px solid var(--color-border)',
    whiteSpace: 'nowrap',
    color: 'var(--color-text)',
  });

  const rowHoverHandlers = onRowClick
    ? {
        onMouseEnter: (e: React.MouseEvent<HTMLTableRowElement>) => {
          e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
        },
        onMouseLeave: (e: React.MouseEvent<HTMLTableRowElement>) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        },
      }
    : {};

  // Loading shimmer
  if (loading) {
    const shimmer: React.CSSProperties = {
      background: 'linear-gradient(90deg, var(--color-surface) 25%, var(--color-surface-hover) 50%, var(--color-surface) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: 'var(--radius-sm)',
      height: '14px',
    };

    return (
      <div style={wrapperStyle}>
        <div style={scrollStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col.key} style={thStyle(col)}>{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map(col => (
                    <td key={col.key} style={tdStyle(col)}>
                      <div style={{ ...shimmer, width: '80%' }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <style>{`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div style={wrapperStyle}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-10) var(--space-6)',
          gap: 'var(--space-3)',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: '2rem', opacity: 0.5 }} aria-hidden="true">{emptyIcon}</span>
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)' }}>
            {emptyTitle}
          </div>
          {emptyDescription && (
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', maxWidth: '320px' }}>
              {emptyDescription}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={wrapperStyle}>
      <div style={scrollStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} style={thStyle(col)}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
              <tr
                key={String(row[keyField])}
                style={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background-color 0.15s',
                }}
                onClick={() => onRowClick?.(row)}
                {...rowHoverHandlers}
              >
                {columns.map(col => (
                  <td key={col.key} style={tdStyle(col)}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
