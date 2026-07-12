/**
 * Drivers feature API client.
 * All server communication for the drivers module lives here.
 */

export interface Driver {
  id: number;
  full_name: string;
  licence_number: string;
  licence_category: string;
  licence_expiry_date: string;
  contact_number: string;
  safety_score: number;
  status: 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';
}

export interface DriverFilters {
  status?: string;
  licence_category?: string;
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

export async function fetchDrivers(filters?: DriverFilters): Promise<Driver[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.licence_category) params.set('licence_category', filters.licence_category);
  if (filters?.search) params.set('search', filters.search);

  const qs = params.toString();
  const url = qs ? `/api/v1/drivers?${qs}` : '/api/v1/drivers';
  const data = await handleResponse<{ drivers: Driver[] }>(await fetch(url));
  return data.drivers || [];
}

export async function createDriver(body: {
  full_name: string;
  licence_number: string;
  licence_category: string;
  licence_expiry_date: string;
  contact_number: string;
  safety_score?: number;
}): Promise<Driver> {
  const data = await handleResponse<{ driver: Driver }>(
    await fetch('/api/v1/drivers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
  return data.driver;
}

export async function updateDriver(
  id: number,
  body: Partial<{
    full_name: string;
    licence_category: string;
    licence_expiry_date: string;
    contact_number: string;
    safety_score: number;
    status: string;
  }>
): Promise<Driver> {
  const data = await handleResponse<{ driver: Driver }>(
    await fetch(`/api/v1/drivers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
  return data.driver;
}
