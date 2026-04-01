import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';

interface JwtPayload {
  userId: string;
  role: Role;
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required. Provide a Bearer token.');
    }

    const token = authHeader.slice(7); // remove "Bearer "

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch {
      throw new AppError(401, 'Invalid or expired token.');
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, status: true },
    });

    if (!user) {
      throw new AppError(401, 'User no longer exists.');
    }

    if (user.status === 'INACTIVE') {
      throw new AppError(403, 'Your account has been deactivated.');
    }

    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
}
