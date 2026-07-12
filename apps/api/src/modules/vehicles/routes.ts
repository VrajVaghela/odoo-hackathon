import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';

const router = Router();

// GET /api/v1/vehicles - List vehicles with optional filters (Fleet Manager)
router.get('/', authenticate, requireRole(['FLEET_MANAGER']), (_req, res) => {
  res.status(200).json({ vehicles: [], message: 'Vehicles route contract placeholder' });
});

// POST /api/v1/vehicles - Register a new vehicle (Fleet Manager)
router.post('/', authenticate, requireRole(['FLEET_MANAGER']), (_req, res) => {
  res.status(201).json({ message: 'Vehicle creation placeholder' });
});

export default router;
