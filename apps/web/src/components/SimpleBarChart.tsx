import React from 'react';

interface BarDatum { label: string; value: number; }
interface SimpleBarChartProps { title: string; data: BarDatum[]; valueLabel: (value: number) => string; }

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ title, data, valueLabel }) => {
  const maxValue = Math.max(...data.map((datum) => datum.value), 0);
  if (data.length === 0 || maxValue === 0) {
    return <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>No report data is available yet.</p>;
  }
  return (
    <div role="img" aria-label={`${title}: ${data.map((datum) => `${datum.label} ${valueLabel(datum.value)}`).join(', ')}`}>
      {data.map((datum) => (
        <div key={datum.label} style={{ display: 'grid', gridTemplateColumns: 'minmax(5rem, 1fr) minmax(8rem, 3fr) auto', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{datum.label}</span>
          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <div style={{ width: `${(datum.value / maxValue) * 100}%`, minHeight: 'var(--space-3)', backgroundColor: 'var(--color-info)' }} />
          </div>
          <span className="tabular-nums" style={{ color: 'var(--color-text)', fontSize: 'var(--text-xs)' }}>{valueLabel(datum.value)}</span>
        </div>
      ))}
    </div>
  );
};
