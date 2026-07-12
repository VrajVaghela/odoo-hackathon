import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { UserManagementController } from './controller.js';

const router = Router();
const controller = new UserManagementController();

// Admin-only endpoints
router.post('/invite', authenticate, requireRole(['ADMIN']), controller.invite);
router.get('/invitations', authenticate, requireRole(['ADMIN']), controller.listInvitations);
router.get('/roles', authenticate, requireRole(['ADMIN']), controller.listRoles);

// Public confirmation endpoint (no auth required — token is the credential)
router.get('/confirm/:token', controller.confirm);

export default router;
