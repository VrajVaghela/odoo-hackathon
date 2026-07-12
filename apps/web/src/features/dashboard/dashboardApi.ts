/**
 * Dashboard feature API client.
 * Uses the role-safe dashboard read model instead of registry endpoints.
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
    const ex: Error & { code?: string; field?: string } = new Error(err?.message || `HTTP ${res.status}`);
    ex.code = err?.code;
    ex.field = err?.field;
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
  fleetUtilisation: number;
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

export interface DashboardFilters {
  vehicleType?: string;
  status?: string;
  region?: string;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  recentTrips: RecentTrip[];
  statusCounts: VehicleStatusCount[];
}

interface DashboardApiTrip {
  id: number;
  trip_code: string;
  source: string;
  destination: string;
  cargo_weight_kg: number;
  status: string;
  dispatched_at: string | null;
  completed_at: string | null;
  vehicle_registration_number: string | null;
  vehicle_name: string | null;
  driver_name: string | null;
}

interface DashboardApiResponse {
  kpis: {
    activeVehicles: {
      total: number;
      onTrip: number;
      inShop: number;
      available: number;
    };
    availableDrivers: {
      total: number;
      names: string[];
    };
    pendingDispatches: {
      total: number;
      draftTripCodes: string[];
    };
    fleetUtilization: {
      value: string;
    };
  };
  activeTrips: DashboardApiTrip[];
}

function parsePercent(value: string): number {
  const parsed = Number(value.replace('%', ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildDashboardUrl(filters?: DashboardFilters): string {
  const params = new URLSearchParams();
  if (filters?.vehicleType) params.set('vehicleType', filters.vehicleType);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.region) params.set('region', filters.region);

  const query = params.toString();
  return query ? `/api/v1/dashboard?${query}` : '/api/v1/dashboard';
}

function mapDashboardResponse(data: DashboardApiResponse): DashboardData {
  const { activeVehicles, availableDrivers, pendingDispatches, fleetUtilization } = data.kpis;
  const activeTrips = data.activeTrips.filter((trip) => trip.status === 'DISPATCHED').length;
  const completedTrips = data.activeTrips.filter((trip) => trip.status === 'COMPLETED').length;

  return {
    kpis: {
      totalVehicles: activeVehicles.total,
      availableVehicles: activeVehicles.available,
      onTripVehicles: activeVehicles.onTrip,
      inShopVehicles: activeVehicles.inShop,
      retiredVehicles: 0,
      totalDrivers: availableDrivers.total,
      availableDrivers: availableDrivers.total,
      activeTrips,
      draftTrips: pendingDispatches.total,
      completedTrips,
      fleetUtilisation: parsePercent(fleetUtilization.value),
    },
    recentTrips: data.activeTrips.slice(0, 10).map((trip) => ({
      id: trip.id,
      trip_code: trip.trip_code,
      source: trip.source,
      destination: trip.destination,
      vehicle_reg: trip.vehicle_registration_number || trip.vehicle_name || '-',
      driver_name: trip.driver_name || '-',
      status: trip.status,
      cargo_weight_kg: trip.cargo_weight_kg,
    })),
    statusCounts: [
      { status: 'AVAILABLE', count: activeVehicles.available },
      { status: 'ON_TRIP', count: activeVehicles.onTrip },
      { status: 'IN_SHOP', count: activeVehicles.inShop },
    ].filter((item) => item.count > 0),
  };
}

export async function fetchDashboardData(filters?: DashboardFilters): Promise<DashboardData> {
  const data = await handleResponse<DashboardApiResponse>(await fetch(buildDashboardUrl(filters)));
  return mapDashboardResponse(data);
}
