import { Router } from 'express';
import { DriverController } from './controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';

const router = Router();
const controller = new DriverController();

// GET /api/v1/drivers/available - List available drivers for dispatch (Safety Officer, Dispatcher)
router.get('/available', authenticate, requireRole(['SAFETY_OFFICER', 'DISPATCHER']), controller.getAvailableDrivers);

// GET /api/v1/drivers - List drivers with filters (Safety Officer)
router.get('/', authenticate, requireRole(['SAFETY_OFFICER']), controller.listDrivers);

// GET /api/v1/drivers/:id - Get a single driver details (Safety Officer)
router.get('/:id', authenticate, requireRole(['SAFETY_OFFICER']), controller.getDriverById);

// POST /api/v1/drivers - Register a new driver (Safety Officer)
router.post('/', authenticate, requireRole(['SAFETY_OFFICER']), controller.createDriver);

// PUT /api/v1/drivers/:id - Update driver details (Safety Officer)
router.put('/:id', authenticate, requireRole(['SAFETY_OFFICER']), controller.updateDriver);

export default router;
