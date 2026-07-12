import { withTransaction } from '../../db/transaction.js';
import { MAINTENANCE_STATUS } from './types.js';
import {
  BusinessRuleViolationError,
  ResourceNotFoundError,
  ValidationError,
} from '../../shared/errors/index.js';
import { MaintenanceRepository } from './repository.js';
import { logAuditEvent } from '../../db/audit.js';

const repo = new MaintenanceRepository();

export class MaintenanceService {
  /**
   * Opens a new active maintenance log for a vehicle.
   * Changes vehicle status to IN_SHOP and blocks dispatch eligibility.
   */
  async openMaintenance(
    vehicleId: number,
    serviceType: string,
    description: string,
    actorUserId: number | null
  ): Promise<any> {
    if (!serviceType || serviceType.trim() === '') {
      throw new ValidationError('Service type is required.', 'service_type');
    }
    if (!description || description.trim() === '') {
      throw new ValidationError('Description is required.', 'description');
    }

    return withTransaction(async (conn) => {
      // 1. Lock vehicle row
      const vehicle = await repo.findVehicleForUpdate(conn, vehicleId);
      if (!vehicle) {
        throw new ResourceNotFoundError(`Vehicle ${vehicleId} not found.`);
      }

      // 2. Validate vehicle is eligible
      if (vehicle.status === 'ON_TRIP') {
        throw new BusinessRuleViolationError(
          'VEHICLE_ON_TRIP',
          `Vehicle ${vehicle.registration_number} is currently on a trip and cannot enter maintenance.`,
          'vehicle_id'
        );
      }
      if (vehicle.status === 'RETIRED') {
        throw new BusinessRuleViolationError(
          'VEHICLE_RETIRED',
          `Vehicle ${vehicle.registration_number} is retired and cannot enter maintenance.`,
          'vehicle_id'
        );
      }

      // Reject if there's already an active maintenance log
      const hasActive = await repo.hasActiveMaintenance(conn, vehicleId);
      if (hasActive) {
        throw new BusinessRuleViolationError(
          'VEHICLE_ALREADY_IN_MAINTENANCE',
          `Vehicle ${vehicle.registration_number} is already in maintenance.`,
          'vehicle_id'
        );
      }

      const beforeVehicle = { status: vehicle.status };

      // 3. Perform updates
      await repo.updateVehicleStatus(conn, vehicleId, 'IN_SHOP');
      const logId = await repo.openMaintenance(conn, vehicleId, serviceType, description);

      // 4. Log audit events
      await logAuditEvent(conn, actorUserId, 'vehicle', vehicleId, 'VEHICLE_STATUS_CHANGED', beforeVehicle, {
        status: 'IN_SHOP',
      });

      await logAuditEvent(conn, actorUserId, 'maintenance_log', logId, 'MAINTENANCE_OPENED', null, {
        vehicle_id: vehicleId,
        service_type: serviceType,
        description: description,
        status: MAINTENANCE_STATUS.ACTIVE,
      });

      const createdLog = await repo.findById(logId, conn);
      return createdLog;
    });
  }

  /**
   * Closes an active maintenance log.
   * Restores vehicle status to AVAILABLE unless it is retired.
   */
  async closeMaintenance(
    logId: number,
    cost: number,
    actorUserId: number | null
  ): Promise<any> {
    if (cost === undefined || isNaN(cost) || cost < 0) {
      throw new ValidationError('Cost must be a non-negative number.', 'cost');
    }

    return withTransaction(async (conn) => {
      // 1. Lock maintenance log FOR UPDATE
      const log = await repo.findLogForUpdate(conn, logId);
      if (!log) {
        throw new ResourceNotFoundError(`Maintenance log ${logId} not found.`);
      }

      // 2. Validate state
      if (log.status !== MAINTENANCE_STATUS.ACTIVE) {
        throw new BusinessRuleViolationError(
          'MAINTENANCE_LOG_NOT_ACTIVE',
          `Maintenance log ${logId} is already closed or not active.`
        );
      }

      // Lock associated vehicle row
      const vehicle = await repo.findVehicleForUpdate(conn, log.vehicle_id);
      const beforeVehicle = vehicle ? { status: vehicle.status } : null;
      const beforeLog = { status: log.status, cost: log.cost, closed_at: log.closed_at };

      // 3. Perform updates
      await repo.closeMaintenance(conn, logId, cost);

      let targetStatus = 'AVAILABLE';
      if (vehicle) {
        if (vehicle.status !== 'RETIRED') {
          await repo.updateVehicleStatus(conn, log.vehicle_id, 'AVAILABLE');
        } else {
          targetStatus = 'RETIRED';
        }
      }

      // 4. Log audit events
      await logAuditEvent(conn, actorUserId, 'maintenance_log', logId, 'MAINTENANCE_CLOSED', beforeLog, {
        status: MAINTENANCE_STATUS.CLOSED,
        cost,
      });

      if (vehicle && vehicle.status !== 'RETIRED') {
        await logAuditEvent(conn, actorUserId, 'vehicle', log.vehicle_id, 'VEHICLE_STATUS_CHANGED', beforeVehicle, {
          status: 'AVAILABLE',
        });
      }

      const updatedLog = await repo.findById(logId, conn);
      return updatedLog;
    });
  }

  /**
   * Lists all maintenance logs.
   */
  async listLogs(vehicleId?: number): Promise<any[]> {
    return repo.listLogs(vehicleId);
  }

  /**
   * Retrieves a single maintenance log by ID.
   */
  async getLog(logId: number): Promise<any> {
    const log = await repo.findById(logId);
    if (!log) {
      throw new ResourceNotFoundError(`Maintenance log ${logId} not found.`);
    }
    return log;
  }
}
