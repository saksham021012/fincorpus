import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { validate } from '../../middleware/validate';
import { updateRoleSchema, updateStatusSchema } from './user.schemas';
import * as userController from './user.controller';

const router = Router();

// Every route in this module requires the user to be an ADMIN
router.use(authenticate, requireRole('ADMIN'));

router.get('/', userController.list);

router.patch(
  '/:id/role',
  validate(updateRoleSchema),
  userController.updateRole,
);

router.patch(
  '/:id/status',
  validate(updateStatusSchema),
  userController.updateStatus,
);

export default router;
