import { Router } from 'express';
import { AuthController } from './controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();
const controller = new AuthController();

router.post('/login', controller.login);
router.post('/logout', controller.logout);
router.get('/me', authenticate, controller.getCurrentUser);

export default router;
