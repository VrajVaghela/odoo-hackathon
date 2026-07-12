import React from 'react';
import { MetricCard } from './MetricCard.tsx';

interface CostSummaryProps {
  fuelCost: number;
  maintenanceCost: number;
  expenseCost: number;
  totalCost: number;
  loading?: boolean;
}

const formatInr = (value: number) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export const CostSummary: React.FC<CostSummaryProps> = ({ fuelCost, maintenanceCost, expenseCost, totalCost, loading = false }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
    <MetricCard label="Fuel Cost" value={formatInr(fuelCost)} statusToken="--color-info" loading={loading} />
    <MetricCard label="Maintenance" value={formatInr(maintenanceCost)} statusToken="--color-warning" loading={loading} />
    <MetricCard label="Other Expenses" value={formatInr(expenseCost)} statusToken="--color-neutral" loading={loading} />
    <MetricCard label="Operational Cost" value={formatInr(totalCost)} statusToken="--color-primary" loading={loading} />
  </div>
);
