import { Router } from 'express';
import { authLimiter } from '../../middleware/rateLimiter';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { registerSchema, loginSchema } from './auth.schemas';
import * as authController from './auth.controller';

const router = Router();

router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  authController.register,
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  authController.login,
);

router.get('/me', authenticate, authController.me);

export default router;
