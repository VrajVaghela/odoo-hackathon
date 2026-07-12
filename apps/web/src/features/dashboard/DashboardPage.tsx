import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../../components/PageHeader.tsx';
import { MetricCard } from '../../components/MetricCard.tsx';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import { LoadingState } from '../../components/LoadingState.tsx';
import { EmptyState } from '../../components/EmptyState.tsx';
import { FilterBar, FilterConfig } from '../../components/FilterBar.tsx';
import { ErrorAlert } from '../../components/ErrorAlert.tsx';
import {
  fetchDashboardKPIs,
  fetchRecentTrips,
  fetchVehicleStatusCounts,
  DashboardKPIs,
  RecentTrip,
  VehicleStatusCount,
} from './dashboardApi.ts';

interface DashboardPageProps {
  userRole: string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ userRole: _userRole }) => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([]);
  const [statusCounts, setStatusCounts] = useState<VehicleStatusCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRegion, setFilterRegion] = useState('');

  const filters: FilterConfig[] = [
    {
      id: 'type', label: 'Vehicle Type', type: 'select', value: filterType,
      options: [
        { value: 'VAN', label: 'Van' },
        { value: 'TRUCK', label: 'Truck' },
      ],
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
      id: 'region', label: 'Region', type: 'select', value: filterRegion,
      options: [
        { value: 'North', label: 'North' },
        { value: 'South', label: 'South' },
        { value: 'East', label: 'East' },
        { value: 'West', label: 'West' },
      ],
    },
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [kpiData, trips, counts] = await Promise.all([
        fetchDashboardKPIs(),
        fetchRecentTrips(),
        fetchVehicleStatusCounts(),
      ]);
      setKpis(kpiData);
      setRecentTrips(trips);
      setStatusCounts(counts);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleFilterChange = (id: string, value: string) => {
    if (id === 'type') setFilterType(value);
    if (id === 'status') setFilterStatus(value);
    if (id === 'region') setFilterRegion(value);
  };

  const handleResetFilters = () => {
    setFilterType('');
    setFilterStatus('');
    setFilterRegion('');
  };

  // Status bar chart
  const statusColorMap: Record<string, string> = {
    AVAILABLE: 'var(--color-success)',
    ON_TRIP: 'var(--color-info)',
    IN_SHOP: 'var(--color-warning)',
    RETIRED: 'var(--color-danger)',
  };

  const totalVehiclesForBar = statusCounts.reduce((s, c) => s + c.count, 0);

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
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Operations Control Overview"
        description="Real-time metrics, fleet status, and active dispatches."
      />

      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* KPI Metric Cards */}
      {loading ? (
        <LoadingState variant="kpi" />
      ) : kpis ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          <MetricCard
            label="Total Vehicles"
            value={kpis.totalVehicles}
            helperText={`${kpis.availableVehicles} available`}
            statusToken="--color-info"
          />
          <MetricCard
            label="Available Drivers"
            value={kpis.availableDrivers}
            helperText={`${kpis.totalDrivers} total`}
            statusToken="--color-success"
          />
          <MetricCard
            label="Active Dispatches"
            value={kpis.activeTrips}
            helperText={`${kpis.draftTrips} draft, ${kpis.completedTrips} completed`}
            statusToken="--color-neutral"
          />
          <MetricCard
            label="Fleet Utilisation"
            value={`${kpis.fleetUtilisation}%`}
            helperText="On-trip / non-retired"
            statusToken="--color-primary"
          />
          <MetricCard
            label="In Shop"
            value={kpis.inShopVehicles}
            helperText="Under maintenance"
            statusToken="--color-warning"
          />
          <MetricCard
            label="Retired"
            value={kpis.retiredVehicles}
            helperText="End of lifecycle"
            statusToken="--color-danger"
          />
        </div>
      ) : null}

      {/* Two-column: Recent Trips + Vehicle Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'var(--space-4)' }}>
        {/* Recent Trips */}
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>Recent Trips</h3>
          {loading ? (
            <LoadingState rows={4} variant="cards" />
          ) : recentTrips.length === 0 ? (
            <EmptyState
              icon="🚛"
              title="No trips yet"
              description="Trips will appear here once dispatched."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {recentTrips.slice(0, 6).map(trip => (
                <div
                  key={trip.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--space-3)',
                    borderBottom: '1px solid var(--color-border)',
                    gap: 'var(--space-3)',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-info)' }}>
                        {trip.trip_code}
                      </span>
                      {' '}
                      <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>
                        {trip.vehicle_reg}
                      </span>
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {trip.source} → {trip.destination}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span className="tabular-nums" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {trip.cargo_weight_kg} kg
                    </span>
                    <StatusBadge status={trip.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vehicle Status Breakdown */}
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>Vehicle Status</h3>
          {loading ? (
            <LoadingState rows={3} variant="cards" />
          ) : statusCounts.length === 0 ? (
            <EmptyState
              icon="🚗"
              title="No vehicles"
              description="Vehicle status breakdown will appear here."
            />
          ) : (
            <>
              {/* Stacked bar */}
              <div style={{
                display: 'flex',
                height: '24px',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                marginBottom: 'var(--space-4)',
                backgroundColor: 'var(--color-surface)',
              }}>
                {statusCounts.map(sc => (
                  <div
                    key={sc.status}
                    style={{
                      width: totalVehiclesForBar > 0 ? `${(sc.count / totalVehiclesForBar) * 100}%` : '0',
                      backgroundColor: statusColorMap[sc.status] || 'var(--color-neutral)',
                      transition: 'width 0.3s ease',
                      minWidth: sc.count > 0 ? '4px' : '0',
                    }}
                    title={`${sc.status}: ${sc.count}`}
                  />
                ))}
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {statusCounts.map(sc => (
                  <div key={sc.status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '2px',
                        backgroundColor: statusColorMap[sc.status] || 'var(--color-neutral)',
                        flexShrink: 0,
                      }} />
                      <StatusBadge status={sc.status} />
                    </div>
                    <span className="tabular-nums" style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>
                      {sc.count}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
