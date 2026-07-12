import { withTransaction } from '../../db/transaction.js';
import { TRIP_STATUS, TripStatus } from './types.js';
import { BusinessRuleViolationError, ResourceNotFoundError } from '../../shared/errors/index.js';

export class TripService {
  /**
   * Drafts a new trip.
   */
  async createDraft(input: any): Promise<any> {
    // Pseudocode / Skeleton:
    // 1. Validate basic input fields (source, destination, cargo_weight_kg, planned_distance_km)
    // 2. Insert record into `trips` table with status = 'DRAFT'
    // 3. Return created trip details
    return { id: 1, ...input, status: TRIP_STATUS.DRAFT };
  }

  /**
   * Dispatches an existing trip. Performs resource checks under lock.
   */
  async dispatchTrip(tripId: number, vehicleId: number, driverId: number): Promise<void> {
    // Transaction logic boundary:
    await withTransaction(async (connection) => {
      // 1. Lock the vehicle, driver, and trip rows with SELECT FOR UPDATE:
      //    SELECT status, max_capacity_kg FROM vehicles WHERE id = ? FOR UPDATE;
      //    SELECT status, licence_expiry_date FROM drivers WHERE id = ? FOR UPDATE;
      //    SELECT status, cargo_weight_kg FROM trips WHERE id = ? FOR UPDATE;
      
      // 2. Re-read and validate states inside the transaction:
      //    - Reject if vehicle status !== 'AVAILABLE' -> VEHICLE_NOT_AVAILABLE
      //    - Reject if driver status !== 'AVAILABLE' -> DRIVER_NOT_AVAILABLE
      //    - Reject if driver licence has expired -> DRIVER_LICENCE_EXPIRED
      //    - Reject if trip status !== 'DRAFT' -> INVALID_TRIP_STATUS
      //    - Reject if trip cargo_weight_kg > vehicle.max_capacity_kg -> CARGO_EXCEEDS_CAPACITY
      
      // 3. Perform the state updates:
      //    - Set vehicle status = 'ON_TRIP'
      //    - Set driver status = 'ON_TRIP'
      //    - Set trip status = 'DISPATCHED', vehicle_id = ?, driver_id = ?, dispatched_at = NOW()
      
      // 4. Log audit log entry:
      //    - INSERT INTO audit_logs (entity_type, entity_id, action, before_json, after_json)
    });
  }

  /**
   * Completes a dispatched trip.
   */
  async completeTrip(tripId: number, actualDistanceKm: number, fuelLiters?: number, fuelCost?: number): Promise<void> {
    await withTransaction(async (connection) => {
      // 1. Lock trip and associated vehicle/driver rows FOR UPDATE
      // 2. Validate trip is status = 'DISPATCHED'
      // 3. Update vehicle odometer: vehicle.odometer_km = vehicle.odometer_km + actualDistanceKm
      // 4. Set vehicle and driver status = 'AVAILABLE'
      // 5. Set trip status = 'COMPLETED', actual_distance_km = ?, completed_at = NOW()
      // 6. Optional: Insert fuel log and expense entries
      // 7. Write audit log
    });
  }

  /**
   * Cancels a dispatched trip.
   */
  async cancelTrip(tripId: number): Promise<void> {
    await withTransaction(async (connection) => {
      // 1. Lock trip, vehicle, and driver rows FOR UPDATE
      // 2. Validate trip is status = 'DISPATCHED' or 'DRAFT'
      // 3. Set vehicle and driver status = 'AVAILABLE'
      // 4. Set trip status = 'CANCELLED'
      // 5. Write audit log
    });
  }
}
