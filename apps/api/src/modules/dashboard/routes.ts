import { Router } from 'express';
import { DashboardController } from './controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';

const router = Router();
const controller = new DashboardController();

// GET /api/v1/dashboard - Fetch dashboard KPIs and active trips board
router.get('/', authenticate, requireRole(['FLEET_MANAGER', 'DISPATCHER']), controller.getDashboard);

export default router;
