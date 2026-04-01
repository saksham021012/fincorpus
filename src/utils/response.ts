import { Response } from 'express';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function success<T>(
  res: Response,
  data: T,
  statusCode = 200,
): Response {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

export function paginated<T>(
  res: Response,
  data: T,
  meta: PaginationMeta,
): Response {
  return res.status(200).json({
    success: true,
    data,
    meta,
  });
}
