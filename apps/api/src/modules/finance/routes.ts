import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { createExpense, createFuelLog, listExpenses, listFuelLogs, listTripOptions, listVehicleOptions } from './controller.js';

const router = Router();

router.get('/vehicles', authenticate, requireRole(['FINANCIAL_ANALYST']), listVehicleOptions);
router.get('/trips', authenticate, requireRole(['FINANCIAL_ANALYST']), listTripOptions);
router.get('/fuel-logs', authenticate, requireRole(['FINANCIAL_ANALYST']), listFuelLogs);
router.post('/fuel-logs', authenticate, requireRole(['FINANCIAL_ANALYST']), createFuelLog);
router.get('/expenses', authenticate, requireRole(['FINANCIAL_ANALYST']), listExpenses);
router.post('/expenses', authenticate, requireRole(['FINANCIAL_ANALYST']), createExpense);

export default router;
