/**
 * Maintenance feature API client.
 */

export interface MaintenanceLog {
  id: number;
  vehicle_id: number;
  service_type: string;
  description: string;
  status: 'ACTIVE' | 'CLOSED';
  cost: number;
  opened_at: string;
  closed_at: string | null;
  // Joined
  vehicle_reg?: string;
  vehicle_name?: string;
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
    const ex: Error & { code?: string; field?: string } = new Error(err?.message || `HTTP ${res.status}`);
    ex.code = err?.code;
    ex.field = err?.field;
    throw ex;
  }
  return res.json() as Promise<T>;
}

export async function fetchMaintenanceLogs(vehicleId?: number): Promise<MaintenanceLog[]> {
  const url = vehicleId ? `/api/v1/maintenance?vehicle_id=${vehicleId}` : '/api/v1/maintenance';
  const data = await handleResponse<{ logs: MaintenanceLog[] }>(await fetch(url));
  return data.logs;
}

export async function fetchMaintenanceLog(id: number): Promise<MaintenanceLog> {
  const data = await handleResponse<{ log: MaintenanceLog }>(await fetch(`/api/v1/maintenance/${id}`));
  return data.log;
}

export async function openMaintenance(body: {
  vehicle_id: number;
  service_type: string;
  description: string;
}): Promise<{ log: MaintenanceLog; message: string }> {
  return handleResponse<{ log: MaintenanceLog; message: string }>(
    await fetch('/api/v1/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
}

export async function closeMaintenance(
  logId: number,
  cost: number
): Promise<{ log: MaintenanceLog; message: string }> {
  return handleResponse<{ log: MaintenanceLog; message: string }>(
    await fetch(`/api/v1/maintenance/${logId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cost }),
    })
  );
}
