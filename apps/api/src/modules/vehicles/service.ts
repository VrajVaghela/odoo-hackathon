import { VehicleRepository } from './repository.js';
import { Vehicle, CreateVehicleInput, UpdateVehicleInput, VehicleFilters } from './types.js';
import { ConflictError, ValidationError, BusinessRuleViolationError, ResourceNotFoundError } from '../../shared/errors/index.js';
import { withTransaction } from '../../db/transaction.js';
import { logAuditEvent } from '../../db/audit.js';

export class VehicleService {
  private vehicleRepository = new VehicleRepository();

  /**
   * Register a new vehicle.
   */
  async createVehicle(input: CreateVehicleInput, actorUserId: number | null): Promise<Vehicle> {
    // 1. Normalize registration number
    if (!input.registration_number) {
      throw new ValidationError('Registration number is required.', 'registration_number');
    }
    const normalizedReg = input.registration_number.trim().toUpperCase();

    // 2. Enforce uniqueness
    const existing = await this.vehicleRepository.findByRegistrationNumber(normalizedReg);
    if (existing) {
      throw new ConflictError(
        `Vehicle with registration number '${normalizedReg}' already exists.`,
        'registration_number'
      );
    }

    // 3. Validate numeric constraints
    if (!input.name || input.name.trim() === '') {
      throw new ValidationError('Vehicle name is required.', 'name');
    }
    if (!input.model || input.model.trim() === '') {
      throw new ValidationError('Vehicle model is required.', 'model');
    }
    if (!input.vehicle_type || input.vehicle_type.trim() === '') {
      throw new ValidationError('Vehicle type is required.', 'vehicle_type');
    }
    if (input.max_capacity_kg === undefined || input.max_capacity_kg <= 0) {
      throw new ValidationError('Max capacity must be greater than 0 kg.', 'max_capacity_kg');
    }
    if (input.odometer_km !== undefined && input.odometer_km < 0) {
      throw new ValidationError('Odometer reading cannot be negative.', 'odometer_km');
    }
    if (input.acquisition_cost === undefined || input.acquisition_cost < 0) {
      throw new ValidationError('Acquisition cost cannot be negative.', 'acquisition_cost');
    }
    if (!input.region || input.region.trim() === '') {
      throw new ValidationError('Region is required.', 'region');
    }

    // 4. Validate initial status
    if (input.status && !['AVAILABLE', 'IN_SHOP', 'RETIRED'].includes(input.status)) {
      throw new ValidationError(
        'Initial status must be AVAILABLE, IN_SHOP, or RETIRED.',
        'status'
      );
    }

    return withTransaction(async (conn) => {
      const vehicle = await this.vehicleRepository.create({
        ...input,
        registration_number: normalizedReg,
      }, conn);

      await logAuditEvent(conn, actorUserId, 'vehicle', vehicle.id, 'VEHICLE_CREATED', null, vehicle);

      return vehicle;
    });
  }

  /**
   * Retrieve a vehicle by ID.
   */
  async getVehicleById(id: number): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findById(id);
    if (!vehicle) {
      throw new ResourceNotFoundError(`Vehicle with ID ${id} not found.`);
    }
    return vehicle;
  }

  /**
   * Update vehicle details and enforce valid status lifecycle changes.
   */
  async updateVehicle(id: number, input: UpdateVehicleInput, actorUserId: number | null): Promise<Vehicle> {
    return withTransaction(async (conn) => {
      // Fetch current vehicle status under block/row lock if updating status
      const current = await this.vehicleRepository.findById(id, conn);
      if (!current) {
        throw new ResourceNotFoundError(`Vehicle with ID ${id} not found.`);
      }

      // 1. Normalize registration number if provided
      let normalizedReg: string | undefined;
      if (input.registration_number !== undefined) {
        if (!input.registration_number) {
          throw new ValidationError('Registration number cannot be empty.', 'registration_number');
        }
        normalizedReg = input.registration_number.trim().toUpperCase();

        if (normalizedReg !== current.registration_number) {
          const existing = await this.vehicleRepository.findByRegistrationNumber(normalizedReg, conn);
          if (existing) {
            throw new ConflictError(
              `Vehicle with registration number '${normalizedReg}' already exists.`,
              'registration_number'
            );
          }
        }
      }

      // 2. Validate numeric constraints if provided
      if (input.max_capacity_kg !== undefined && input.max_capacity_kg <= 0) {
        throw new ValidationError('Max capacity must be greater than 0 kg.', 'max_capacity_kg');
      }
      if (input.odometer_km !== undefined && input.odometer_km < 0) {
        throw new ValidationError('Odometer reading cannot be negative.', 'odometer_km');
      }
      if (input.acquisition_cost !== undefined && input.acquisition_cost < 0) {
        throw new ValidationError('Acquisition cost cannot be negative.', 'acquisition_cost');
      }

      // 3. Enforce lifecycle transitions for vehicle status
      if (input.status !== undefined && input.status !== current.status) {
        const currentStatus = current.status;
        const targetStatus = input.status;

        if (!['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'].includes(targetStatus)) {
          throw new ValidationError(`Invalid vehicle status: ${targetStatus}`, 'status');
        }

        // Check current state restrictions
        if (currentStatus === 'ON_TRIP') {
          throw new BusinessRuleViolationError(
            'INVALID_STATE_CHANGE',
            'Cannot manually change status of a vehicle currently on a trip.',
            'status'
          );
        }
        if (currentStatus === 'IN_SHOP') {
          throw new BusinessRuleViolationError(
            'INVALID_STATE_CHANGE',
            'Cannot manually change status of a vehicle currently in maintenance. Please use the maintenance workflow.',
            'status'
          );
        }

        // Check target state restrictions
        if (targetStatus === 'ON_TRIP') {
          throw new BusinessRuleViolationError(
            'INVALID_STATE_CHANGE',
            'Vehicle status cannot be manually set to ON_TRIP.',
            'status'
          );
        }
        if (targetStatus === 'IN_SHOP') {
          throw new BusinessRuleViolationError(
            'INVALID_STATE_CHANGE',
            'Vehicle status cannot be manually set to IN_SHOP. Please use the maintenance workflow.',
            'status'
          );
        }
      }

      const updated = await this.vehicleRepository.update(id, {
        ...input,
        ...(normalizedReg ? { registration_number: normalizedReg } : {}),
      }, conn);

      await logAuditEvent(conn, actorUserId, 'vehicle', id, 'VEHICLE_UPDATED', current, updated);

      return updated;
    });
  }

  /**
   * List vehicles with filters and pagination.
   */
  async listVehicles(filters: VehicleFilters): Promise<{ vehicles: Vehicle[]; total: number }> {
    return this.vehicleRepository.list(filters);
  }

  /**
   * Get all active available vehicles for dispatch.
   */
  async getAvailableVehicles(): Promise<Vehicle[]> {
    return this.vehicleRepository.getAvailable();
  }
}
