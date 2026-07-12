import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import {
  listLogs,
  getLog,
  openMaintenance,
  closeMaintenance,
} from './controller.js';

const router = Router();

// GET /api/v1/maintenance - List maintenance logs (Fleet Manager)
router.get(
  '/',
  authenticate,
  requireRole(['FLEET_MANAGER']),
  listLogs
);

// GET /api/v1/maintenance/:id - Fetch single maintenance log details (Fleet Manager)
router.get(
  '/:id',
  authenticate,
  requireRole(['FLEET_MANAGER']),
  getLog
);

// POST /api/v1/maintenance - Open maintenance for a vehicle (Fleet Manager)
router.post(
  '/',
  authenticate,
  requireRole(['FLEET_MANAGER']),
  openMaintenance
);

// POST /api/v1/maintenance/:id/close - Close maintenance (Fleet Manager)
router.post(
  '/:id/close',
  authenticate,
  requireRole(['FLEET_MANAGER']),
  closeMaintenance
);

export default router;
