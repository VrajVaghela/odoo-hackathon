export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';

export const DRIVER_STATUS = {
  AVAILABLE: 'AVAILABLE' as DriverStatus,
  ON_TRIP: 'ON_TRIP' as DriverStatus,
  OFF_DUTY: 'OFF_DUTY' as DriverStatus,
  SUSPENDED: 'SUSPENDED' as DriverStatus,
} as const;

export interface Driver {
  id: number;
  full_name: string;
  licence_number: string;
  licence_category: string;
  licence_expiry_date: string;
  contact_number: string;
  safety_score: number;
  status: DriverStatus;
}

export interface CreateDriverInput {
  full_name: string;
  licence_number: string;
  licence_category: string;
  licence_expiry_date: string;
  contact_number: string;
  safety_score?: number;
  status?: DriverStatus;
}

export interface UpdateDriverInput {
  full_name?: string;
  licence_number?: string;
  licence_category?: string;
  licence_expiry_date?: string;
  contact_number?: string;
  safety_score?: number;
  status?: DriverStatus;
}

export interface DriverFilters {
  status?: string;
  licence_category?: string;
  page?: number;
  limit?: number;
}
