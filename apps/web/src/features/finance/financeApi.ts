export interface FinanceVehicleOption {
  id: number;
  registration_number: string;
  name: string;
}

export interface FinanceTripOption {
  id: number;
  trip_code: string;
  vehicle_id: number | null;
  status: string;
}

export interface FuelLog {
  id: number;
  vehicle_id: number;
  trip_id: number | null;
  logged_at: string;
  liters: number;
  cost: number;
  odometer_km: number;
  vehicle_registration_number: string;
  trip_code: string | null;
}

export interface Expense {
  id: number;
  vehicle_id: number | null;
  trip_id: number | null;
  category: 'TOLL' | 'PARKING' | 'OTHER' | 'MAINTENANCE_ADJUSTMENT';
  amount: number;
  occurred_at: string;
  note: string | null;
  vehicle_registration_number: string | null;
  trip_code: string | null;
}

export interface CreateFuelLogRequest {
  vehicle_id: number;
  trip_id?: number;
  logged_at: string;
  liters: number;
  cost: number;
  odometer_km: number;
}

export interface CreateExpenseRequest {
  vehicle_id?: number;
  trip_id?: number;
  category: Expense['category'];
  amount: number;
  occurred_at: string;
  note?: string;
}

interface ApiError { code: string; message: string; field?: string; }

async function responseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: ApiError };
    const error = new Error(body.error?.message || `Request failed (${response.status})`) as Error & ApiError;
    error.code = body.error?.code || 'REQUEST_FAILED';
    error.field = body.error?.field;
    throw error;
  }
  return response.json() as Promise<T>;
}

export async function fetchFinanceOptions(): Promise<{ vehicles: FinanceVehicleOption[]; trips: FinanceTripOption[] }> {
  const [vehicleData, tripData] = await Promise.all([
    responseJson<{ vehicles: FinanceVehicleOption[] }>(await fetch('/api/v1/finance/vehicles')),
    responseJson<{ trips: FinanceTripOption[] }>(await fetch('/api/v1/finance/trips')),
  ]);
  return { vehicles: vehicleData.vehicles, trips: tripData.trips };
}

export async function fetchFuelLogs(): Promise<FuelLog[]> {
  const data = await responseJson<{ fuelLogs: FuelLog[] }>(await fetch('/api/v1/finance/fuel-logs'));
  return data.fuelLogs;
}

export async function fetchExpenses(): Promise<Expense[]> {
  const data = await responseJson<{ expenses: Expense[] }>(await fetch('/api/v1/finance/expenses'));
  return data.expenses;
}

export async function createFuelLog(input: CreateFuelLogRequest): Promise<FuelLog> {
  const data = await responseJson<{ fuelLog: FuelLog }>(await fetch('/api/v1/finance/fuel-logs', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  }));
  return data.fuelLog;
}

export async function createExpense(input: CreateExpenseRequest): Promise<Expense> {
  const data = await responseJson<{ expense: Expense }>(await fetch('/api/v1/finance/expenses', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  }));
  return data.expense;
}
