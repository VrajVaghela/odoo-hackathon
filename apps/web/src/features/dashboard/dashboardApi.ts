/**
 * Dashboard feature API client.
 * Fetches KPI metrics, recent trips, and vehicle status breakdown.
 * Falls back to aggregating from vehicles/trips if no dashboard endpoint exists.
 */

interface ApiError {
  code: string;
  message: string;
  field?: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: ApiError };
    const err = body?.error;
    const ex: Error & { code?: string } = new Error(err?.message || `HTTP ${res.status}`);
    ex.code = err?.code;
    throw ex;
  }
  return res.json() as Promise<T>;
}

export interface DashboardKPIs {
  totalVehicles: number;
  availableVehicles: number;
  onTripVehicles: number;
  inShopVehicles: number;
  retiredVehicles: number;
  totalDrivers: number;
  availableDrivers: number;
  activeTrips: number;
  draftTrips: number;
  completedTrips: number;
  fleetUtilisation: number; // percentage
}

export interface RecentTrip {
  id: number;
  trip_code: string;
  source: string;
  destination: string;
  vehicle_reg?: string;
  driver_name?: string;
  status: string;
  cargo_weight_kg: number;
}

export interface VehicleStatusCount {
  status: string;
  count: number;
}

/** Fetch dashboard data from the dedicated endpoint */
async function fetchDashboardRaw(): Promise<{ kpis: any; activeTrips: any[] }> {
  return handleResponse<{ kpis: any; activeTrips: any[] }>(await fetch('/api/v1/dashboard'));
}

/**
 * Fetch dashboard KPIs from backend.
 */
export async function fetchDashboardKPIs(): Promise<DashboardKPIs> {
  const data = await fetchDashboardRaw();
  const kpis = data.kpis;
  return {
    totalVehicles: kpis.totalVehicles || 0,
    availableVehicles: kpis.availableVehicles || 0,
    onTripVehicles: kpis.onTripVehicles || 0,
    inShopVehicles: kpis.inShopVehicles || 0,
    retiredVehicles: kpis.retiredVehicles || 0,
    totalDrivers: kpis.totalDrivers || 0,
    availableDrivers: kpis.availableDriversCount || 0,
    activeTrips: kpis.activeTrips || 0,
    draftTrips: kpis.draftTrips || 0,
    completedTrips: kpis.completedTrips || 0,
    fleetUtilisation: kpis.fleetUtilisation || 0,
  };
}

/** Fetch recent trips for the dispatch board */
export async function fetchRecentTrips(): Promise<RecentTrip[]> {
  const data = await fetchDashboardRaw();
  return (data.activeTrips || [])
    .sort((a: any, b: any) => {
      const dateA = a.dispatched_at || a.completed_at || '0';
      const dateB = b.dispatched_at || b.completed_at || '0';
      return dateB.localeCompare(dateA);
    })
    .slice(0, 10)
    .map((t: any) => ({
      id: t.id,
      trip_code: t.trip_code,
      source: t.source,
      destination: t.destination,
      vehicle_reg: t.vehicle_registration_number || t.vehicle_name || '—',
      driver_name: t.driver_name || '—',
      status: t.status,
      cargo_weight_kg: Number(t.cargo_weight_kg),
    }));
}

/** Get vehicle status breakdown counts */
export async function fetchVehicleStatusCounts(): Promise<VehicleStatusCount[]> {
  const data = await fetchDashboardRaw();
  const kpis = data.kpis;
  return [
    { status: 'AVAILABLE', count: kpis.availableVehicles || 0 },
    { status: 'ON_TRIP', count: kpis.onTripVehicles || 0 },
    { status: 'IN_SHOP', count: kpis.inShopVehicles || 0 },
    { status: 'RETIRED', count: kpis.retiredVehicles || 0 },
  ];
}
