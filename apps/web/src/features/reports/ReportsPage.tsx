import React, { useCallback, useEffect, useState } from 'react';
import { CostSummary } from '../../components/CostSummary.tsx';
import { DataTable, Column } from '../../components/DataTable.tsx';
import { ErrorAlert } from '../../components/ErrorAlert.tsx';
import { LoadingState } from '../../components/LoadingState.tsx';
import { MetricCard } from '../../components/MetricCard.tsx';
import { PageHeader } from '../../components/PageHeader.tsx';
import { SimpleBarChart } from '../../components/SimpleBarChart.tsx';
import { FleetReport, VehicleReportRow, downloadFleetCsv, fetchFleetReport } from './reportsApi.ts';

const money = (value: number) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export const ReportsPage: React.FC = () => {
  const [report, setReport] = useState<FleetReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setReport(await fetchFleetReport()); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Could not load analytics.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const exportCsv = async () => {
    setExporting(true); setError(null);
    try {
      const blob = await downloadFleetCsv();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = 'transitops-fleet-report.csv'; anchor.click();
      URL.revokeObjectURL(url);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Could not export the report.'); }
    finally { setExporting(false); }
  };

  const columns: Column<VehicleReportRow>[] = [
    { key: 'registration_number', header: 'Vehicle', render: (row) => <span style={{ fontFamily: 'var(--font-mono)' }}>{row.registration_number}</span> },
    { key: 'fuel_efficiency_km_per_liter', header: 'Fuel Efficiency', align: 'right', render: (row) => row.fuel_efficiency_km_per_liter === null ? '—' : `${row.fuel_efficiency_km_per_liter} km/L` },
    { key: 'operational_cost', header: 'Operational Cost', align: 'right', render: (row) => money(row.operational_cost) },
    { key: 'completed_revenue', header: 'Completed Revenue', align: 'right', render: (row) => money(row.completed_revenue) },
    { key: 'roi_percent', header: 'ROI', align: 'right', render: (row) => row.roi_percent === null ? '—' : `${row.roi_percent}%` },
  ];

  const exportButton = <button type="button" onClick={() => void exportCsv()} disabled={exporting || !report} style={{ height: 'var(--control-height)', padding: '0 var(--space-4)', borderRadius: 'var(--radius-sm)', border: 'none', backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-contrast)', fontWeight: 700, cursor: exporting ? 'not-allowed' : 'pointer' }}>{exporting ? 'Exporting…' : 'Export CSV'}</button>;
  if (loading) return <LoadingState variant="kpi" />;

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
    <PageHeader title="Analytics Reports" description="Fuel efficiency, operational cost, utilisation, and ROI derived from persisted fleet records." actions={exportButton} />
    {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
    {report && <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
        <MetricCard label="Fleet Utilisation" value={`${report.summary.fleet_utilisation_percent}%`} helperText="On-trip / non-retired fleet" statusToken="--color-info" />
        <MetricCard label="Completed Revenue" value={money(report.summary.completed_revenue)} helperText="Completed trips only" statusToken="--color-success" />
        <MetricCard label="Fleet ROI" value={report.summary.fleet_roi_percent === null ? '—' : `${report.summary.fleet_roi_percent}%`} helperText="Revenue − fuel − maintenance / acquisition cost" statusToken="--color-primary" />
      </div>
      <CostSummary fuelCost={report.summary.fuel_cost} maintenanceCost={report.summary.maintenance_cost} expenseCost={report.summary.expense_cost} totalCost={report.summary.operational_cost} />
      <section style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        <h3 style={{ marginTop: 0, fontSize: 'var(--text-lg)' }}>Top Operational Costs</h3>
        <SimpleBarChart title="Top operational costs by vehicle" data={report.vehicles.filter((row) => row.operational_cost > 0).sort((left, right) => right.operational_cost - left.operational_cost).slice(0, 5).map((row) => ({ label: row.registration_number, value: row.operational_cost }))} valueLabel={money} />
      </section>
      <section style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        <h3 style={{ marginTop: 0, fontSize: 'var(--text-lg)' }}>Vehicle Performance</h3>
        <DataTable columns={columns} data={report.vehicles} keyField="vehicle_id" emptyTitle="No vehicle report data" emptyDescription="Costs and performance will appear once operational records are logged." />
      </section>
    </>}
  </div>;
};
