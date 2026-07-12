import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './service.js';

export class DashboardController {
  private dashboardService = new DashboardService();

  /**
   * HTTP Handler for getting dashboard summary and filtered active dispatches.
   */
  getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { vehicleType, status, region } = req.query;

      const filters = {
        vehicleType: vehicleType ? String(vehicleType) : undefined,
        status: status ? String(status) : undefined,
        region: region ? String(region) : undefined,
      };

      const data = await this.dashboardService.getDashboardData(filters);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };
}
