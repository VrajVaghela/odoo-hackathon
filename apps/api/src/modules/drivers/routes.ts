import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';

const router = Router();

// GET /api/v1/drivers - List drivers with filters (Safety Officer)
router.get('/', authenticate, requireRole(['SAFETY_OFFICER']), (_req, res) => {
  res.status(200).json({ drivers: [], message: 'Drivers route contract placeholder' });
});

// POST /api/v1/drivers - Register a new driver (Safety Officer)
router.post('/', authenticate, requireRole(['SAFETY_OFFICER']), (_req, res) => {
  res.status(201).json({ message: 'Driver creation placeholder' });
});

export default router;
