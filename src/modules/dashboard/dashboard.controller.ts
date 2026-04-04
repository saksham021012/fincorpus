import { Request, Response, NextFunction } from 'express';
import * as dashboardService from './dashboard.service';
import { success } from '../../utils/response';

export async function summary(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await dashboardService.getSummary();
    success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function recentActivity(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await dashboardService.getRecentActivity();
    success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function categoryBreakdown(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await dashboardService.getCategoryBreakdown();
    success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function monthlyTrends(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await dashboardService.getMonthlyTrends();
    success(res, data);
  } catch (err) {
    next(err);
  }
}
