import { Request, Response, NextFunction } from 'express';
import { DriverService } from './service.js';

export class DriverController {
  private driverService = new DriverService();

  /**
   * HTTP Handler for listing drivers with filters and pagination.
   */
  listDrivers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, licenceCategory, page, limit } = req.query;

      const filters = {
        status: status ? String(status) : undefined,
        licence_category: licenceCategory ? String(licenceCategory) : undefined,
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 10,
      };

      const result = await this.driverService.listDrivers(filters);

      res.status(200).json({
        drivers: result.drivers,
        total: result.total,
        page: filters.page,
        limit: filters.limit,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * HTTP Handler for fetching a single driver by ID.
   */
  getDriverById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Driver ID must be a valid integer.',
          },
        });
        return;
      }

      const driver = await this.driverService.getDriverById(id);
      res.status(200).json({ driver });
    } catch (err) {
      next(err);
    }
  };

  /**
   * HTTP Handler for creating/registering a driver.
   */
  createDriver = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const driver = await this.driverService.createDriver(req.body);
      res.status(201).json({ driver });
    } catch (err) {
      next(err);
    }
  };

  /**
   * HTTP Handler for updating a driver details.
   */
  updateDriver = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Driver ID must be a valid integer.',
          },
        });
        return;
      }

      const driver = await this.driverService.updateDriver(id, req.body);
      res.status(200).json({ driver });
    } catch (err) {
      next(err);
    }
  };

  /**
   * HTTP Handler for fetching all available drivers for dispatch.
   */
  getAvailableDrivers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const drivers = await this.driverService.getAvailableDrivers();
      res.status(200).json({ drivers });
    } catch (err) {
      next(err);
    }
  };
}
