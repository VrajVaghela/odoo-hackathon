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

/** Fetch vehicles list from API — used to compute dashboard KPIs */
async function fetchVehiclesRaw(): Promise<any[]> {
  try {
    const data = await handleResponse<{ vehicles: any[] }>(await fetch('/api/v1/vehicles'));
    return data.vehicles || [];
  } catch {
    return [];
  }
}

/** Fetch drivers list from API */
async function fetchDriversRaw(): Promise<any[]> {
  try {
    const data = await handleResponse<{ drivers: any[] }>(await fetch('/api/v1/drivers'));
    return data.drivers || [];
  } catch {
    return [];
  }
}

/** Fetch trips list from API */
async function fetchTripsRaw(status?: string): Promise<any[]> {
  try {
    const url = status ? `/api/v1/trips?status=${encodeURIComponent(status)}` : '/api/v1/trips';
    const data = await handleResponse<{ trips: any[] }>(await fetch(url));
    return data.trips || [];
  } catch {
    return [];
  }
}

/**
 * Compute dashboard KPIs by aggregating vehicles, drivers, and trips data.
 * This approach works even when the backend has no dedicated dashboard endpoint.
 */
export async function fetchDashboardKPIs(): Promise<DashboardKPIs> {
  const [vehicles, drivers, trips] = await Promise.all([
    fetchVehiclesRaw(),
    fetchDriversRaw(),
    fetchTripsRaw(),
  ]);

  const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE').length;
  const onTripVehicles = vehicles.filter(v => v.status === 'ON_TRIP').length;
  const inShopVehicles = vehicles.filter(v => v.status === 'IN_SHOP').length;
  const retiredVehicles = vehicles.filter(v => v.status === 'RETIRED').length;
  const totalVehicles = vehicles.length;

  const availableDrivers = drivers.filter(d => d.status === 'AVAILABLE').length;
  const totalDrivers = drivers.length;

  const activeTrips = trips.filter(t => t.status === 'DISPATCHED').length;
  const draftTrips = trips.filter(t => t.status === 'DRAFT').length;
  const completedTrips = trips.filter(t => t.status === 'COMPLETED').length;

  const nonRetired = totalVehicles - retiredVehicles;
  const fleetUtilisation = nonRetired > 0
    ? Math.round((onTripVehicles / nonRetired) * 100)
    : 0;

  return {
    totalVehicles,
    availableVehicles,
    onTripVehicles,
    inShopVehicles,
    retiredVehicles,
    totalDrivers,
    availableDrivers,
    activeTrips,
    draftTrips,
    completedTrips,
    fleetUtilisation,
  };
}

/** Fetch recent trips for the dispatch board */
export async function fetchRecentTrips(): Promise<RecentTrip[]> {
  const trips = await fetchTripsRaw();
  // Sort by most recent first, take 10
  return trips
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
      vehicle_reg: t.vehicle_reg || t.vehicle_name || '—',
      driver_name: t.driver_name || '—',
      status: t.status,
      cargo_weight_kg: t.cargo_weight_kg,
    }));
}

/** Get vehicle status breakdown counts */
export async function fetchVehicleStatusCounts(): Promise<VehicleStatusCount[]> {
  const vehicles = await fetchVehiclesRaw();
  const counts: Record<string, number> = {};
  vehicles.forEach((v: any) => {
    counts[v.status] = (counts[v.status] || 0) + 1;
  });
  return Object.entries(counts).map(([status, count]) => ({ status, count }));
}
