import { ValidationError } from '../../shared/errors/index.js';

export interface CreateTripInput {
  source: string;
  destination: string;
  cargo_weight_kg: number;
  planned_distance_km: number;
  revenue?: number;
}

export interface DispatchTripInput {
  vehicle_id: number;
  driver_id: number;
}

/**
 * Validates and normalises trip creation input.
 * Throws ValidationError on failure.
 */
export function validateCreateTripInput(body: unknown): CreateTripInput {
  if (typeof body !== 'object' || body === null) {
    throw new ValidationError('Request body must be a JSON object.');
  }
  const b = body as Record<string, unknown>;

  const source = typeof b.source === 'string' ? b.source.trim() : '';
  if (!source) {
    throw new ValidationError('source is required.', 'source');
  }

  const destination = typeof b.destination === 'string' ? b.destination.trim() : '';
  if (!destination) {
    throw new ValidationError('destination is required.', 'destination');
  }

  if (source === destination) {
    throw new ValidationError('Source and destination must be different.', 'destination');
  }

  const cargoWeightKg = Number(b.cargo_weight_kg);
  if (!Number.isFinite(cargoWeightKg) || cargoWeightKg <= 0) {
    throw new ValidationError('cargo_weight_kg must be a positive number.', 'cargo_weight_kg');
  }

  const plannedDistanceKm = Number(b.planned_distance_km);
  if (!Number.isFinite(plannedDistanceKm) || plannedDistanceKm <= 0) {
    throw new ValidationError('planned_distance_km must be a positive number.', 'planned_distance_km');
  }

  const revenue = b.revenue !== undefined ? Number(b.revenue) : 0;
  if (!Number.isFinite(revenue) || revenue < 0) {
    throw new ValidationError('revenue must be a non-negative number.', 'revenue');
  }

  return { source, destination, cargo_weight_kg: cargoWeightKg, planned_distance_km: plannedDistanceKm, revenue };
}

/**
 * Validates and normalises trip dispatch input.
 * Throws ValidationError on failure.
 */
export function validateDispatchTripInput(body: unknown): DispatchTripInput {
  if (typeof body !== 'object' || body === null) {
    throw new ValidationError('Request body must be a JSON object.');
  }
  const b = body as Record<string, unknown>;

  const vehicleId = Number(b.vehicle_id);
  if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
    throw new ValidationError('vehicle_id must be a positive integer.', 'vehicle_id');
  }

  const driverId = Number(b.driver_id);
  if (!Number.isInteger(driverId) || driverId <= 0) {
    throw new ValidationError('driver_id must be a positive integer.', 'driver_id');
  }

  return { vehicle_id: vehicleId, driver_id: driverId };
}
