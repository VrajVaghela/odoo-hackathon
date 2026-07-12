import { Request, Response, NextFunction } from 'express';
import { VehicleService } from './service.js';

export class VehicleController {
  private vehicleService = new VehicleService();

  /**
   * HTTP Handler for listing vehicles with filters and pagination.
   */
  listVehicles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, vehicleType, region, page, limit } = req.query;

      const filters = {
        status: status ? String(status) : undefined,
        vehicle_type: vehicleType ? String(vehicleType) : undefined,
        region: region ? String(region) : undefined,
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 10,
      };

      const result = await this.vehicleService.listVehicles(filters);

      res.status(200).json({
        vehicles: result.vehicles,
        total: result.total,
        page: filters.page,
        limit: filters.limit,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * HTTP Handler for fetching a single vehicle by ID.
   */
  getVehicleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Vehicle ID must be a valid integer.',
          },
        });
        return;
      }

      const vehicle = await this.vehicleService.getVehicleById(id);
      res.status(200).json({ vehicle });
    } catch (err) {
      next(err);
    }
  };

  /**
   * HTTP Handler for creating/registering a vehicle.
   */
  createVehicle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vehicle = await this.vehicleService.createVehicle(req.body);
      res.status(201).json({ vehicle });
    } catch (err) {
      next(err);
    }
  };

  /**
   * HTTP Handler for updating a vehicle.
   */
  updateVehicle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Vehicle ID must be a valid integer.',
          },
        });
        return;
      }

      const vehicle = await this.vehicleService.updateVehicle(id, req.body);
      res.status(200).json({ vehicle });
    } catch (err) {
      next(err);
    }
  };

  /**
   * HTTP Handler for fetching all available vehicles for dispatch.
   */
  getAvailableVehicles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vehicles = await this.vehicleService.getAvailableVehicles();
      res.status(200).json({ vehicles });
    } catch (err) {
      next(err);
    }
  };
}
