import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import {
  createTrip,
  dispatchTrip,
  listTrips,
  getTrip,
  getDispatchOptions,
} from './controller.js';

const router = Router();

// GET /api/v1/trips/dispatch-options - Available vehicles and drivers for form (Dispatcher, Fleet Manager)
// Must be registered before /:id routes to avoid being matched as an id
router.get(
  '/dispatch-options',
  authenticate,
  requireRole(['DISPATCHER', 'FLEET_MANAGER']),
  getDispatchOptions
);

// GET /api/v1/trips - List trips with optional status filter (Dispatcher, Fleet Manager)
router.get(
  '/',
  authenticate,
  requireRole(['DISPATCHER', 'FLEET_MANAGER']),
  listTrips
);

// POST /api/v1/trips - Create a new DRAFT trip (Dispatcher)
router.post(
  '/',
  authenticate,
  requireRole(['DISPATCHER']),
  createTrip
);

// GET /api/v1/trips/:id - Get a single trip (Dispatcher, Fleet Manager)
router.get(
  '/:id',
  authenticate,
  requireRole(['DISPATCHER', 'FLEET_MANAGER']),
  getTrip
);

// POST /api/v1/trips/:id/dispatch - Dispatch a DRAFT trip (Dispatcher)
router.post(
  '/:id/dispatch',
  authenticate,
  requireRole(['DISPATCHER']),
  dispatchTrip
);

export default router;
