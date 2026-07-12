import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import {
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
  listTrips,
  getTrip,
  getDispatchOptions,
} from './controller.js';

const router = Router();

// GET /api/v1/trips/dispatch-options — must be registered BEFORE /:id
router.get(
  '/dispatch-options',
  authenticate,
  requireRole(['DISPATCHER', 'FLEET_MANAGER']),
  getDispatchOptions
);

// GET /api/v1/trips
router.get(
  '/',
  authenticate,
  requireRole(['DISPATCHER', 'FLEET_MANAGER']),
  listTrips
);

// POST /api/v1/trips — create DRAFT
router.post(
  '/',
  authenticate,
  requireRole(['DISPATCHER']),
  createTrip
);

// GET /api/v1/trips/:id
router.get(
  '/:id',
  authenticate,
  requireRole(['DISPATCHER', 'FLEET_MANAGER']),
  getTrip
);

// POST /api/v1/trips/:id/dispatch — DRAFT → DISPATCHED
router.post(
  '/:id/dispatch',
  authenticate,
  requireRole(['DISPATCHER']),
  dispatchTrip
);

// POST /api/v1/trips/:id/complete — DISPATCHED → COMPLETED
router.post(
  '/:id/complete',
  authenticate,
  requireRole(['DISPATCHER']),
  completeTrip
);

// POST /api/v1/trips/:id/cancel — DRAFT|DISPATCHED → CANCELLED
router.post(
  '/:id/cancel',
  authenticate,
  requireRole(['DISPATCHER']),
  cancelTrip
);

export default router;
