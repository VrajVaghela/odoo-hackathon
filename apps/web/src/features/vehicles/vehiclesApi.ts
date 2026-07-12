/**
 * Vehicles feature API client.
 * All server communication for the vehicles module lives here.
 */

export interface Vehicle {
  id: number;
  registration_number: string;
  name: string;
  model: string;
  vehicle_type: string;
  max_capacity_kg: number;
  odometer_km: number;
  acquisition_cost: number;
  status: 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED';
  region: string;
  retired_at: string | null;
}

export interface VehicleFilters {
  status?: string;
  vehicle_type?: string;
  region?: string;
  search?: string;
}

interface ApiError {
  code: string;
  message: string;
  field?: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: ApiError };
    const err = body?.error;
    const ex: Error & { code?: string; field?: string } = new Error(
      err?.message || `HTTP ${res.status}`
    );
    ex.code = err?.code;
    ex.field = err?.field;
    throw ex;
  }
  return res.json() as Promise<T>;
}

export async function fetchVehicles(filters?: VehicleFilters): Promise<Vehicle[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.vehicle_type) params.set('vehicle_type', filters.vehicle_type);
  if (filters?.region) params.set('region', filters.region);
  if (filters?.search) params.set('search', filters.search);

  const qs = params.toString();
  const url = qs ? `/api/v1/vehicles?${qs}` : '/api/v1/vehicles';
  const data = await handleResponse<{ vehicles: Vehicle[] }>(await fetch(url));
  return data.vehicles || [];
}

export async function createVehicle(body: {
  registration_number: string;
  name: string;
  model: string;
  vehicle_type: string;
  max_capacity_kg: number;
  odometer_km: number;
  acquisition_cost: number;
  region: string;
}): Promise<Vehicle> {
  const data = await handleResponse<{ vehicle: Vehicle }>(
    await fetch('/api/v1/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
  return data.vehicle;
}

export async function updateVehicle(
  id: number,
  body: Partial<{
    name: string;
    model: string;
    vehicle_type: string;
    max_capacity_kg: number;
    odometer_km: number;
    region: string;
    status: string;
  }>
): Promise<Vehicle> {
  const data = await handleResponse<{ vehicle: Vehicle }>(
    await fetch(`/api/v1/vehicles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
  return data.vehicle;
}
