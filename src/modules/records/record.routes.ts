import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { validate } from '../../middleware/validate';
import {
  createRecordSchema,
  updateRecordSchema,
  listQuerySchema,
} from './record.schemas';
import * as recordController from './record.controller';

const router = Router();

// All records routes require authentication
router.use(authenticate);

// GET /api/records — all roles can view (VIEWER, ANALYST, ADMIN)
router.get(
  '/',
  validate(listQuerySchema, 'query'),
  recordController.list,
);

// GET /api/records/:id — all roles
router.get('/:id', recordController.getById);

// POST /api/records — ADMIN only
router.post(
  '/',
  requireRole('ADMIN'),
  validate(createRecordSchema),
  recordController.create,
);

// PATCH /api/records/:id — ADMIN only
router.patch(
  '/:id',
  requireRole('ADMIN'),
  validate(updateRecordSchema),
  recordController.update,
);

// DELETE /api/records/:id — ADMIN only (soft delete)
router.delete(
  '/:id',
  requireRole('ADMIN'),
  recordController.softDelete,
);

export default router;
