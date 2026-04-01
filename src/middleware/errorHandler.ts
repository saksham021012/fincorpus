import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Known operational error thrown by our services
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Prisma known errors — map to clean HTTP responses
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      // Unique constraint violation (e.g. duplicate email)
      res.status(409).json({
        success: false,
        message: 'A record with that value already exists.',
      });
      return;
    }

    if (err.code === 'P2025') {
      // Record not found (e.g. update/delete on nonexistent row)
      res.status(404).json({
        success: false,
        message: 'Record not found.',
      });
      return;
    }
  }

  // Unexpected error — log it, return generic 500
  console.error('[Unhandled Error]', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred. Please try again later.',
  });
}
