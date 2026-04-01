import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { RegisterInput, LoginInput } from './auth.schemas';
import { success } from '../../utils/response';

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.register(req.body as RegisterInput);
    success(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.login(req.body as LoginInput);
    success(res, result);
  } catch (err) {
    next(err);
  }
}

export async function me(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.getProfile(req.user.id);
    success(res, result);
  } catch (err) {
    next(err);
  }
}
