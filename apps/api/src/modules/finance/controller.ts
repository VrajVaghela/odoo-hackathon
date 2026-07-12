import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import { FinanceService } from './service.js';
import { validateCreateExpenseInput, validateCreateFuelLogInput } from './validator.js';

const service = new FinanceService();

function optionalVehicleId(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export async function createFuelLog(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const fuelLog = await service.createFuelLog(validateCreateFuelLogInput(req.body), req.user?.id ?? null);
    res.status(201).json({ fuelLog });
  } catch (error) {
    next(error);
  }
}

export async function listFuelLogs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const fuelLogs = await service.listFuelLogs(optionalVehicleId(req.query.vehicle_id));
    res.status(200).json({ fuelLogs });
  } catch (error) {
    next(error);
  }
}

export async function createExpense(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const expense = await service.createExpense(validateCreateExpenseInput(req.body), req.user?.id ?? null);
    res.status(201).json({ expense });
  } catch (error) {
    next(error);
  }
}

export async function listExpenses(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const expenses = await service.listExpenses(optionalVehicleId(req.query.vehicle_id));
    res.status(200).json({ expenses });
  } catch (error) {
    next(error);
  }
}

export async function listVehicleOptions(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json({ vehicles: await service.listVehicleOptions() });
  } catch (error) {
    next(error);
  }
}

export async function listTripOptions(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json({ trips: await service.listTripOptions() });
  } catch (error) {
    next(error);
  }
}
