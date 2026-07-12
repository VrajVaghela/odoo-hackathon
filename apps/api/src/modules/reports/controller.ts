import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import { ReportsService } from './service.js';

const service = new ReportsService();

export async function getSummary(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(await service.getFleetReport());
  } catch (error) {
    next(error);
  }
}

export async function exportCsv(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const csv = await service.buildCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="transitops-fleet-report.csv"');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
}
