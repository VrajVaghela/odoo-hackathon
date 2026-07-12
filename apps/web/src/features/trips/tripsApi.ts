/**
 * Trips feature API client.
 * All server communication for the trips module lives here.
 */

export interface Trip {
  id: number;
  trip_code: string;
  source: string;
  destination: string;
  vehicle_id: number | null;
  driver_id: number | null;
  cargo_weight_kg: number;
  planned_distance_km: number;
  actual_distance_km: number | null;
  status: 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';
  revenue: number;
  dispatched_at: string | null;
  completed_at: string | null;
  // Joined fields
  vehicle_reg?: string;
  vehicle_name?: string;
  driver_name?: string;
}

export interface AvailableVehicle {
  id: number;
  registration_number: string;
  name: string;
  model: string;
  vehicle_type: string;
  max_capacity_kg: number;
  region: string;
}

export interface AvailableDriver {
  id: number;
  full_name: string;
  licence_number: string;
  licence_category: string;
  licence_expiry_date: string;
  safety_score: number;
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

export async function fetchTrips(status?: string): Promise<Trip[]> {
  const url = status ? `/api/v1/trips?status=${encodeURIComponent(status)}` : '/api/v1/trips';
  const data = await handleResponse<{ trips: Trip[] }>(await fetch(url));
  return data.trips;
}

export async function fetchTrip(id: number): Promise<Trip> {
  const data = await handleResponse<{ trip: Trip }>(await fetch(`/api/v1/trips/${id}`));
  return data.trip;
}

export async function createTrip(body: {
  source: string;
  destination: string;
  cargo_weight_kg: number;
  planned_distance_km: number;
  revenue?: number;
}): Promise<Trip> {
  const data = await handleResponse<{ trip: Trip }>(
    await fetch('/api/v1/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
  return data.trip;
}

export async function dispatchTrip(
  tripId: number,
  vehicleId: number,
  driverId: number
): Promise<{ trip: Trip; message: string }> {
  return handleResponse<{ trip: Trip; message: string }>(
    await fetch(`/api/v1/trips/${tripId}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicle_id: vehicleId, driver_id: driverId }),
    })
  );
}

export async function fetchDispatchOptions(): Promise<{
  vehicles: AvailableVehicle[];
  drivers: AvailableDriver[];
}> {
  return handleResponse<{ vehicles: AvailableVehicle[]; drivers: AvailableDriver[] }>(
    await fetch('/api/v1/trips/dispatch-options')
  );
}

export async function completeTrip(
  tripId: number,
  actualDistanceKm: number
): Promise<{ trip: Trip; message: string }> {
  return handleResponse<{ trip: Trip; message: string }>(
    await fetch(`/api/v1/trips/${tripId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actual_distance_km: actualDistanceKm }),
    })
  );
}

export async function cancelTrip(
  tripId: number,
  reason?: string
): Promise<{ trip: Trip; message: string }> {
  return handleResponse<{ trip: Trip; message: string }>(
    await fetch(`/api/v1/trips/${tripId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
  );
}

