import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import { MaintenanceService } from './service.js';

const service = new MaintenanceService();

/**
 * GET /api/v1/maintenance
 * Lists maintenance logs, with optional vehicle_id query parameter.
 */
export async function listLogs(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const vehicleId = req.query.vehicle_id ? Number(req.query.vehicle_id) : undefined;
    const logs = await service.listLogs(vehicleId);
    res.status(200).json({ logs });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/maintenance/:id
 * Fetches details of a single maintenance log.
 */
export async function getLog(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const logId = Number(req.params.id);
    const log = await service.getLog(logId);
    res.status(200).json({ log });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/maintenance
 * Opens a new active maintenance log for a vehicle.
 */
export async function openMaintenance(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { vehicle_id, service_type, description } = req.body;
    if (!vehicle_id || isNaN(Number(vehicle_id))) {
      res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Vehicle ID must be a valid number.',
          field: 'vehicle_id',
        },
      });
      return;
    }

    const log = await service.openMaintenance(
      Number(vehicle_id),
      service_type,
      description,
      req.user?.id ?? null
    );

    res.status(201).json({
      log,
      message: 'Vehicle checked into maintenance. Status updated to IN_SHOP.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/maintenance/:id/close
 * Closes an active maintenance log and updates vehicle status.
 */
export async function closeMaintenance(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const logId = Number(req.params.id);
    const cost = Number(req.body.cost);

    if (isNaN(cost) || cost < 0) {
      res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Cost must be a non-negative number.',
          field: 'cost',
        },
      });
      return;
    }

    const log = await service.closeMaintenance(logId, cost, req.user?.id ?? null);

    res.status(200).json({
      log,
      message: 'Maintenance log closed. Vehicle status restored.',
    });
  } catch (err) {
    next(err);
  }
}
