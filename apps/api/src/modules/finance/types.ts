export type ExpenseCategory = 'TOLL' | 'PARKING' | 'OTHER' | 'MAINTENANCE_ADJUSTMENT';

export const EXPENSE_CATEGORIES: readonly ExpenseCategory[] = [
  'TOLL',
  'PARKING',
  'OTHER',
  'MAINTENANCE_ADJUSTMENT',
];

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
  category: ExpenseCategory;
  amount: number;
  occurred_at: string;
  note: string | null;
  vehicle_registration_number: string | null;
  trip_code: string | null;
}

export interface CreateFuelLogInput {
  vehicle_id: number;
  trip_id?: number;
  logged_at: string;
  liters: number;
  cost: number;
  odometer_km: number;
}

export interface CreateExpenseInput {
  vehicle_id?: number;
  trip_id?: number;
  category: ExpenseCategory;
  amount: number;
  occurred_at: string;
  note?: string;
}

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
