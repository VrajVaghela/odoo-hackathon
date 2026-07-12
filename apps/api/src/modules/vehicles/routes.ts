import { Router } from 'express';
import { VehicleController } from './controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';

const router = Router();
const controller = new VehicleController();

// GET /api/v1/vehicles/available - List available vehicles for dispatch (Fleet Manager, Dispatcher)
router.get('/available', authenticate, requireRole(['FLEET_MANAGER', 'DISPATCHER']), controller.getAvailableVehicles);

// GET /api/v1/vehicles - List vehicles with filters (Fleet Manager)
router.get('/', authenticate, requireRole(['FLEET_MANAGER']), controller.listVehicles);

// GET /api/v1/vehicles/:id - Get a single vehicle details (Fleet Manager)
router.get('/:id', authenticate, requireRole(['FLEET_MANAGER']), controller.getVehicleById);

// POST /api/v1/vehicles - Register a new vehicle (Fleet Manager)
router.post('/', authenticate, requireRole(['FLEET_MANAGER']), controller.createVehicle);

// PUT /api/v1/vehicles/:id - Update vehicle details (Fleet Manager)
router.put('/:id', authenticate, requireRole(['FLEET_MANAGER']), controller.updateVehicle);

export default router;
