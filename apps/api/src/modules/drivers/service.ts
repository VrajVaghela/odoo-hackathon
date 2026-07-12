import { DriverRepository } from './repository.js';
import { Driver, CreateDriverInput, UpdateDriverInput, DriverFilters } from './types.js';
import { ConflictError, ValidationError, BusinessRuleViolationError, ResourceNotFoundError } from '../../shared/errors/index.js';

export class DriverService {
  private driverRepository = new DriverRepository();

  /**
   * Register a new driver.
   */
  async createDriver(input: CreateDriverInput): Promise<Driver> {
    // 1. Normalize licence number
    if (!input.licence_number) {
      throw new ValidationError('Licence number is required.', 'licence_number');
    }
    const normalizedLicence = input.licence_number.trim().toUpperCase();

    // 2. Enforce uniqueness
    const existing = await this.driverRepository.findByLicenceNumber(normalizedLicence);
    if (existing) {
      throw new ConflictError(
        `Driver with licence number '${normalizedLicence}' already exists.`,
        'licence_number'
      );
    }

    // 3. Validate constraints
    if (!input.full_name || input.full_name.trim() === '') {
      throw new ValidationError('Full name is required.', 'full_name');
    }
    if (!input.licence_category || !['LIGHT', 'HEAVY'].includes(input.licence_category.trim().toUpperCase())) {
      throw new ValidationError('Licence category must be LIGHT or HEAVY.', 'licence_category');
    }
    if (!input.licence_expiry_date) {
      throw new ValidationError('Licence expiry date is required.', 'licence_expiry_date');
    }
    // Simple date format check (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.licence_expiry_date)) {
      throw new ValidationError('Licence expiry date must be in YYYY-MM-DD format.', 'licence_expiry_date');
    }
    if (!input.contact_number || input.contact_number.trim() === '') {
      throw new ValidationError('Contact number is required.', 'contact_number');
    }
    if (input.safety_score !== undefined && (input.safety_score < 0 || input.safety_score > 100)) {
      throw new ValidationError('Safety score must be between 0.00 and 100.00.', 'safety_score');
    }

    // 4. Validate status
    if (input.status && !['AVAILABLE', 'OFF_DUTY', 'SUSPENDED'].includes(input.status)) {
      throw new ValidationError('Initial status must be AVAILABLE, OFF_DUTY, or SUSPENDED.', 'status');
    }

    return this.driverRepository.create({
      ...input,
      licence_number: normalizedLicence,
      licence_category: input.licence_category.trim().toUpperCase(),
    });
  }

  /**
   * Retrieve a driver by ID.
   */
  async getDriverById(id: number): Promise<Driver> {
    const driver = await this.driverRepository.findById(id);
    if (!driver) {
      throw new ResourceNotFoundError(`Driver with ID ${id} not found.`);
    }
    return driver;
  }

  /**
   * Update driver details and check lifecycle transitions.
   */
  async updateDriver(id: number, input: UpdateDriverInput): Promise<Driver> {
    const current = await this.getDriverById(id);

    // 1. Normalize licence number if provided
    let normalizedLicence: string | undefined;
    if (input.licence_number !== undefined) {
      if (!input.licence_number) {
        throw new ValidationError('Licence number cannot be empty.', 'licence_number');
      }
      normalizedLicence = input.licence_number.trim().toUpperCase();

      if (normalizedLicence !== current.licence_number) {
        const existing = await this.driverRepository.findByLicenceNumber(normalizedLicence);
        if (existing) {
          throw new ConflictError(
            `Driver with licence number '${normalizedLicence}' already exists.`,
            'licence_number'
          );
        }
      }
    }

    // 2. Validate category and constraints if provided
    if (input.licence_category !== undefined) {
      if (!['LIGHT', 'HEAVY'].includes(input.licence_category.trim().toUpperCase())) {
        throw new ValidationError('Licence category must be LIGHT or HEAVY.', 'licence_category');
      }
    }
    if (input.licence_expiry_date !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(input.licence_expiry_date)) {
        throw new ValidationError('Licence expiry date must be in YYYY-MM-DD format.', 'licence_expiry_date');
      }
    }
    if (input.safety_score !== undefined && (input.safety_score < 0 || input.safety_score > 100)) {
      throw new ValidationError('Safety score must be between 0.00 and 100.00.', 'safety_score');
    }

    // 3. Enforce lifecycle transitions for driver status
    if (input.status !== undefined && input.status !== current.status) {
      const currentStatus = current.status;
      const targetStatus = input.status;

      if (!['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED'].includes(targetStatus)) {
        throw new ValidationError(`Invalid driver status: ${targetStatus}`, 'status');
      }

      // Check current state restrictions
      if (currentStatus === 'ON_TRIP') {
        throw new BusinessRuleViolationError(
          'INVALID_STATE_CHANGE',
          'Cannot manually change status of a driver currently on a trip.',
          'status'
        );
      }

      // Check target state restrictions
      if (targetStatus === 'ON_TRIP') {
        throw new BusinessRuleViolationError(
          'INVALID_STATE_CHANGE',
          'Driver status cannot be manually set to ON_TRIP.',
          'status'
        );
      }
    }

    return this.driverRepository.update(id, {
      ...input,
      ...(normalizedLicence ? { licence_number: normalizedLicence } : {}),
      ...(input.licence_category ? { licence_category: input.licence_category.trim().toUpperCase() } : {}),
    });
  }

  /**
   * List drivers with filters and pagination.
   */
  async listDrivers(filters: DriverFilters): Promise<{ drivers: Driver[]; total: number }> {
    return this.driverRepository.list(filters);
  }

  /**
   * Get all active available drivers for dispatch.
   */
  async getAvailableDrivers(): Promise<Driver[]> {
    return this.driverRepository.getAvailable();
  }
}
