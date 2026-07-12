export type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED';

export const VEHICLE_STATUS = {
  AVAILABLE: 'AVAILABLE' as VehicleStatus,
  ON_TRIP: 'ON_TRIP' as VehicleStatus,
  IN_SHOP: 'IN_SHOP' as VehicleStatus,
  RETIRED: 'RETIRED' as VehicleStatus,
} as const;

export interface Vehicle {
  id: number;
  registration_number: string;
  name: string;
  model: string;
  vehicle_type: string;
  max_capacity_kg: number;
  odometer_km: number;
  acquisition_cost: number;
  status: VehicleStatus;
  region: string;
  retired_at: string | null;
}

export interface CreateVehicleInput {
  registration_number: string;
  name: string;
  model: string;
  vehicle_type: string;
  max_capacity_kg: number;
  odometer_km?: number;
  acquisition_cost: number;
  region: string;
  status?: VehicleStatus;
}

export interface UpdateVehicleInput {
  registration_number?: string;
  name?: string;
  model?: string;
  vehicle_type?: string;
  max_capacity_kg?: number;
  odometer_km?: number;
  acquisition_cost?: number;
  region?: string;
  status?: VehicleStatus;
}

export interface VehicleFilters {
  status?: string;
  vehicle_type?: string;
  region?: string;
  page?: number;
  limit?: number;
}
