import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import * as dashboardController from './dashboard.controller';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

// Accessible by all roles (VIEWER, ANALYST, ADMIN)
router.get('/summary', dashboardController.summary);
router.get('/recent', dashboardController.recentActivity);

// Accessible by ANALYST and ADMIN only
router.get(
  '/categories',
  requireRole('ANALYST', 'ADMIN'),
  dashboardController.categoryBreakdown,
);

router.get(
  '/trends',
  requireRole('ANALYST', 'ADMIN'),
  dashboardController.monthlyTrends,
);

export default router;
