import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { RegisterInput, LoginInput } from './auth.schemas';
import { success } from '../../utils/response';
import { AppError } from '../../utils/AppError';
import { env } from '../../config/env';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
};

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { accessToken, refreshToken, user } = await authService.register(req.body as RegisterInput);
    setRefreshCookie(res, refreshToken);
    success(res, { accessToken, user }, 201);
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
    const { accessToken, refreshToken, user } = await authService.login(req.body as LoginInput);
    setRefreshCookie(res, refreshToken);
    success(res, { accessToken, user });
  } catch (err) {
    next(err);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return next(new AppError(401, 'No refresh token provided.'));
    }
    const { accessToken, refreshToken } = await authService.refreshAccess(token);
    setRefreshCookie(res, refreshToken);
    success(res, { accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    success(res, { message: 'Logged out successfully' });
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
