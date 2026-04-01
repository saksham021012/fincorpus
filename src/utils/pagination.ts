import { PaginationMeta } from './response';

export function paginate(page: number, limit: number, total: number): {
  skip: number;
  take: number;
  meta: PaginationMeta;
} {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100); // cap at 100
  const skip = (safePage - 1) * safeLimit;
  const totalPages = Math.ceil(total / safeLimit);

  return {
    skip,
    take: safeLimit,
    meta: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
    },
  };
}
