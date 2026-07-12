export type TripStatus = 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';

export const TRIP_STATUS = {
  DRAFT: 'DRAFT' as TripStatus,
  DISPATCHED: 'DISPATCHED' as TripStatus,
  COMPLETED: 'COMPLETED' as TripStatus,
  CANCELLED: 'CANCELLED' as TripStatus,
} as const;

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
  status: TripStatus;
  revenue: number;
  dispatched_at: string | null;
  completed_at: string | null;
}

export interface CreateTripInput {
  source: string;
  destination: string;
  cargo_weight_kg: number;
  planned_distance_km: number;
  vehicle_id?: number;
  driver_id?: number;
}
