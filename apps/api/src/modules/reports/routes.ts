import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { exportCsv, getSummary } from './controller.js';

const router = Router();

router.get('/summary', authenticate, requireRole(['FINANCIAL_ANALYST']), getSummary);
router.get('/export.csv', authenticate, requireRole(['FINANCIAL_ANALYST']), exportCsv);

export default router;
