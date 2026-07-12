import { withTransaction } from '../../db/transaction.js';
import { BusinessRuleViolationError, ResourceNotFoundError } from '../../shared/errors/index.js';
import { TripRepository } from './repository.js';
import { Trip, TRIP_STATUS } from './types.js';
import { CreateTripInput, DispatchTripInput, CompleteTripInput, CancelTripInput } from './validator.js';

const repo = new TripRepository();

export class TripService {
  /**
   * Creates a new DRAFT trip record.
   */
  async createDraft(input: CreateTripInput, actorUserId: number | null): Promise<Trip> {
    return withTransaction(async (conn) => {
      const tripCode = await repo.generateTripCode(conn);
      const tripId = await repo.insertDraft(
        conn,
        tripCode,
        input.source,
        input.destination,
        input.cargo_weight_kg,
        input.planned_distance_km,
        input.revenue ?? 0
      );
      await repo.insertAuditLog(conn, actorUserId, 'trip', tripId, 'TRIP_CREATED', null, {
        trip_code: tripCode,
        status: TRIP_STATUS.DRAFT,
        source: input.source,
        destination: input.destination,
        cargo_weight_kg: input.cargo_weight_kg,
      });
      const trip = await repo.findByIdForUpdate(conn, tripId);
      return trip!;
    });
  }

  /**
   * Dispatches a DRAFT trip with full business-rule validation under row locks.
   *
   * Rules enforced (all under SELECT FOR UPDATE):
   *  - Trip must be in DRAFT status.
   *  - Vehicle must be AVAILABLE (not RETIRED, IN_SHOP, ON_TRIP).
   *  - Driver must be AVAILABLE (not SUSPENDED, OFF_DUTY, ON_TRIP).
   *  - Driver licence must not be expired.
   *  - Vehicle capacity must not be exceeded by cargo weight.
   *  - Vehicle and driver must not be the same as another current dispatch (prevented by status lock).
   */
  async dispatchTrip(
    tripId: number,
    input: DispatchTripInput,
    actorUserId: number | null
  ): Promise<Trip> {
    return withTransaction(async (conn) => {
      // Lock all three rows before reading state
      const trip = await repo.findByIdForUpdate(conn, tripId);
      if (!trip) {
        throw new ResourceNotFoundError(`Trip ${tripId} not found.`);
      }

      const vehicle = await repo.findVehicleForUpdate(conn, input.vehicle_id);
      if (!vehicle) {
        throw new ResourceNotFoundError(`Vehicle ${input.vehicle_id} not found.`);
      }

      const driver = await repo.findDriverForUpdate(conn, input.driver_id);
      if (!driver) {
        throw new ResourceNotFoundError(`Driver ${input.driver_id} not found.`);
      }

      // --- Business rule checks (server is authoritative) ---

      // 1. Trip must be DRAFT
      if (trip.status !== TRIP_STATUS.DRAFT) {
        throw new BusinessRuleViolationError(
          'INVALID_TRIP_STATUS',
          `Trip ${trip.trip_code} is in ${trip.status} status and cannot be dispatched.`
        );
      }

      // 2. Vehicle eligibility
      if (vehicle.status === 'RETIRED') {
        throw new BusinessRuleViolationError(
          'VEHICLE_RETIRED',
          `Vehicle ${vehicle.registration_number} is retired and cannot be dispatched.`,
          'vehicle_id'
        );
      }
      if (vehicle.status === 'IN_SHOP') {
        throw new BusinessRuleViolationError(
          'VEHICLE_IN_SHOP',
          `Vehicle ${vehicle.registration_number} is currently in the shop for maintenance.`,
          'vehicle_id'
        );
      }
      if (vehicle.status === 'ON_TRIP') {
        throw new BusinessRuleViolationError(
          'VEHICLE_ON_TRIP',
          `Vehicle ${vehicle.registration_number} is already on an active trip.`,
          'vehicle_id'
        );
      }
      if (vehicle.status !== 'AVAILABLE') {
        throw new BusinessRuleViolationError(
          'VEHICLE_NOT_AVAILABLE',
          `Vehicle ${vehicle.registration_number} is not available for dispatch.`,
          'vehicle_id'
        );
      }

      // 3. Driver eligibility
      if (driver.status === 'SUSPENDED') {
        throw new BusinessRuleViolationError(
          'DRIVER_SUSPENDED',
          `Driver ${driver.full_name} is suspended and cannot be assigned.`,
          'driver_id'
        );
      }
      if (driver.status === 'OFF_DUTY') {
        throw new BusinessRuleViolationError(
          'DRIVER_OFF_DUTY',
          `Driver ${driver.full_name} is currently off duty.`,
          'driver_id'
        );
      }
      if (driver.status === 'ON_TRIP') {
        throw new BusinessRuleViolationError(
          'DRIVER_ON_TRIP',
          `Driver ${driver.full_name} is already assigned to an active trip.`,
          'driver_id'
        );
      }
      if (driver.status !== 'AVAILABLE') {
        throw new BusinessRuleViolationError(
          'DRIVER_NOT_AVAILABLE',
          `Driver ${driver.full_name} is not available for dispatch.`,
          'driver_id'
        );
      }

      // 4. Licence expiry check
      const expiryDate = new Date(driver.licence_expiry_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiryDate < today) {
        throw new BusinessRuleViolationError(
          'DRIVER_LICENCE_EXPIRED',
          `Driver ${driver.full_name}'s licence expired on ${driver.licence_expiry_date}. A valid licence is required.`,
          'driver_id'
        );
      }

      // 5. Cargo capacity check
      const cargoKg = Number(trip.cargo_weight_kg);
      const capacityKg = Number(vehicle.max_capacity_kg);
      if (cargoKg > capacityKg) {
        const over = (cargoKg - capacityKg).toFixed(2);
        throw new BusinessRuleViolationError(
          'CARGO_EXCEEDS_CAPACITY',
          `Cargo is ${over} kg over ${vehicle.registration_number}'s ${capacityKg} kg capacity.`,
          'cargo_weight_kg'
        );
      }

      // --- All checks passed: perform atomic state update ---
      const beforeTrip = { status: trip.status, vehicle_id: trip.vehicle_id, driver_id: trip.driver_id };
      await repo.dispatchTrip(conn, tripId, input.vehicle_id, input.driver_id);

      // Audit: trip
      await repo.insertAuditLog(conn, actorUserId, 'trip', tripId, 'TRIP_DISPATCHED', beforeTrip, {
        status: TRIP_STATUS.DISPATCHED,
        vehicle_id: input.vehicle_id,
        driver_id: input.driver_id,
      });
      // Audit: vehicle
      await repo.insertAuditLog(conn, actorUserId, 'vehicle', input.vehicle_id, 'VEHICLE_STATUS_CHANGED', {
        status: vehicle.status,
      }, { status: 'ON_TRIP' });
      // Audit: driver
      await repo.insertAuditLog(conn, actorUserId, 'driver', input.driver_id, 'DRIVER_STATUS_CHANGED', {
        status: driver.status,
      }, { status: 'ON_TRIP' });

      const updated = await repo.findByIdForUpdate(conn, tripId);
      return updated!;
    });
  }

  /**
   * Completes a DISPATCHED trip.
   *
   * Rules enforced under SELECT FOR UPDATE:
   *  - Trip must be in DISPATCHED status.
   *  - actual_distance_km must be a positive number (further capped at 3× planned).
   *  - Vehicle and driver are restored to AVAILABLE atomically.
   *  - Vehicle odometer is incremented by actual distance.
   */
  async completeTrip(
    tripId: number,
    input: CompleteTripInput,
    actorUserId: number | null
  ): Promise<Trip> {
    return withTransaction(async (conn) => {
      const trip = await repo.findByIdForUpdate(conn, tripId);
      if (!trip) {
        throw new ResourceNotFoundError(`Trip ${tripId} not found.`);
      }

      if (trip.status !== TRIP_STATUS.DISPATCHED) {
        throw new BusinessRuleViolationError(
          'INVALID_TRIP_STATUS',
          `Trip ${trip.trip_code} is in ${trip.status} status. Only DISPATCHED trips can be completed.`
        );
      }

      // Odometer sanity: actual distance must not exceed 3× planned distance
      const plannedKm = Number(trip.planned_distance_km);
      const actualKm = input.actual_distance_km;
      const maxAllowed = plannedKm * 3;
      if (actualKm > maxAllowed) {
        throw new BusinessRuleViolationError(
          'DISTANCE_EXCEEDS_LIMIT',
          `Actual distance ${actualKm} km is more than 3× the planned ${plannedKm} km. Verify the odometer reading.`,
          'actual_distance_km'
        );
      }

      const vehicleId = trip.vehicle_id!;
      const driverId = trip.driver_id!;

      // Lock vehicle and driver rows before updating
      await repo.findVehicleForUpdate(conn, vehicleId);
      await repo.findDriverForUpdate(conn, driverId);

      const beforeTrip = { status: trip.status, actual_distance_km: trip.actual_distance_km };
      await repo.completeTrip(conn, tripId, vehicleId, driverId, actualKm);

      await repo.insertAuditLog(conn, actorUserId, 'trip', tripId, 'TRIP_COMPLETED', beforeTrip, {
        status: TRIP_STATUS.COMPLETED,
        actual_distance_km: actualKm,
      });
      await repo.insertAuditLog(conn, actorUserId, 'vehicle', vehicleId, 'VEHICLE_STATUS_CHANGED',
        { status: 'ON_TRIP' }, { status: 'AVAILABLE', odometer_increment_km: actualKm });
      await repo.insertAuditLog(conn, actorUserId, 'driver', driverId, 'DRIVER_STATUS_CHANGED',
        { status: 'ON_TRIP' }, { status: 'AVAILABLE' });

      const updated = await repo.findByIdForUpdate(conn, tripId);
      return updated!;
    });
  }

  /**
   * Cancels a DRAFT or DISPATCHED trip.
   *
   * Rules enforced under SELECT FOR UPDATE:
   *  - Trip must be in DRAFT or DISPATCHED status. COMPLETED/CANCELLED cannot be cancelled.
   *  - If DISPATCHED: vehicle and driver are restored to AVAILABLE atomically.
   *  - If DRAFT: no vehicle/driver was assigned, so no restore is needed.
   */
  async cancelTrip(
    tripId: number,
    input: CancelTripInput,
    actorUserId: number | null
  ): Promise<Trip> {
    return withTransaction(async (conn) => {
      const trip = await repo.findByIdForUpdate(conn, tripId);
      if (!trip) {
        throw new ResourceNotFoundError(`Trip ${tripId} not found.`);
      }

      if (trip.status === TRIP_STATUS.COMPLETED) {
        throw new BusinessRuleViolationError(
          'TRIP_ALREADY_COMPLETED',
          `Trip ${trip.trip_code} is already completed and cannot be cancelled.`
        );
      }
      if (trip.status === TRIP_STATUS.CANCELLED) {
        throw new BusinessRuleViolationError(
          'TRIP_ALREADY_CANCELLED',
          `Trip ${trip.trip_code} is already cancelled.`
        );
      }

      const wasDispatched = trip.status === TRIP_STATUS.DISPATCHED;
      const vehicleId = wasDispatched ? trip.vehicle_id : null;
      const driverId = wasDispatched ? trip.driver_id : null;

      // Lock vehicle and driver rows if they were assigned
      if (vehicleId !== null) await repo.findVehicleForUpdate(conn, vehicleId);
      if (driverId !== null) await repo.findDriverForUpdate(conn, driverId);

      const beforeTrip = { status: trip.status };
      await repo.cancelTrip(conn, tripId, vehicleId, driverId);

      await repo.insertAuditLog(conn, actorUserId, 'trip', tripId, 'TRIP_CANCELLED', beforeTrip, {
        status: TRIP_STATUS.CANCELLED,
        reason: input.reason ?? null,
      });

      if (wasDispatched && vehicleId !== null) {
        await repo.insertAuditLog(conn, actorUserId, 'vehicle', vehicleId, 'VEHICLE_STATUS_CHANGED',
          { status: 'ON_TRIP' }, { status: 'AVAILABLE' });
      }
      if (wasDispatched && driverId !== null) {
        await repo.insertAuditLog(conn, actorUserId, 'driver', driverId, 'DRIVER_STATUS_CHANGED',
          { status: 'ON_TRIP' }, { status: 'AVAILABLE' });
      }

      const updated = await repo.findByIdForUpdate(conn, tripId);
      return updated!;
    });
  }

  /**
   * Lists trips, optionally filtered by status.
   */
  async listTrips(status?: string): Promise<Trip[]> {
    return repo.listTrips(status);
  }

  /**
   * Fetches a single trip by id.
   */
  async getTrip(id: number): Promise<Trip> {
    const trip = await repo.findById(id);
    if (!trip) {
      throw new ResourceNotFoundError(`Trip ${id} not found.`);
    }
    return trip;
  }

  /**
   * Returns available vehicles and drivers for the dispatch form.
   */
  async getDispatchOptions(): Promise<{ vehicles: any[]; drivers: any[] }> {
    const [vehicles, drivers] = await Promise.all([
      repo.listAvailableVehicles(),
      repo.listAvailableDrivers(),
    ]);
    return { vehicles, drivers };
  }
}
