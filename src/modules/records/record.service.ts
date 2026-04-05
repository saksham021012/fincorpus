import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { invalidateDashboardCache } from '../../config/redis';
import { AppError } from '../../utils/AppError';
import { paginate } from '../../utils/pagination';
import {
  CreateRecordInput,
  UpdateRecordInput,
  ListQueryInput,
} from './record.schemas';

// Every query against FinancialRecord MUST include this filter
const whereActive = (): { deletedAt: null } => ({ deletedAt: null });

export async function createRecord(userId: string, input: CreateRecordInput) {
  const record = await prisma.financialRecord.create({
    data: {
      userId,
      amount: input.amount,
      type: input.type,
      category: input.category,
      date: input.date,
      description: input.description,
    },
  });
  await invalidateDashboardCache();
  return record;
}

export async function listRecords(query: ListQueryInput) {
  const where: Prisma.FinancialRecordWhereInput = { ...whereActive() };

  if (query.type) {
    where.type = query.type;
  }

  if (query.category) {
    where.category = { contains: query.category, mode: 'insensitive' };
  }

  if (query.search) {
    where.description = { contains: query.search, mode: 'insensitive' };
  }

  if (query.startDate || query.endDate) {
    where.date = {};
    if (query.startDate) where.date.gte = query.startDate;
    if (query.endDate) where.date.lte = query.endDate;
  }

  const total = await prisma.financialRecord.count({ where });
  const { skip, take, meta } = paginate(query.page, query.limit, total);

  const records = await prisma.financialRecord.findMany({
    where,
    orderBy: { [query.sortBy]: query.sortOrder },
    skip,
    take,
    select: {
      id: true,
      amount: true,
      type: true,
      category: true,
      date: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return { records, meta };
}

export async function getRecordById(id: string) {
  const record = await prisma.financialRecord.findFirst({
    where: { id, ...whereActive() },
    select: {
      id: true,
      amount: true,
      type: true,
      category: true,
      date: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!record) {
    throw new AppError(404, 'Financial record not found.');
  }

  return record;
}

export async function updateRecord(id: string, input: UpdateRecordInput) {
  // exactOptionalPropertyTypes: true means Prisma's update types reject T | undefined.
  // We must build the data object explicitly, only setting fields that were provided.
  const data: Prisma.FinancialRecordUpdateInput = {};
  if (input.amount !== undefined) data.amount = input.amount;
  if (input.type !== undefined) data.type = input.type;
  if (input.category !== undefined) data.category = input.category;
  if (input.date !== undefined) data.date = input.date;
  if (input.description !== undefined) data.description = input.description;

  // Use updateMany for atomicity since it allows us to filter by deletedAt: null (unlike update)
  const result = await prisma.financialRecord.updateMany({
    where: { id, ...whereActive() },
    data,
  });

  if (result.count === 0) {
    throw new AppError(404, 'Financial record not found.');
  }

  await invalidateDashboardCache();

  // Fetch the updated record to return it
  return await getRecordById(id);
}

export async function softDeleteRecord(id: string) {
  // Atomic soft delete preventing TOCTOU races
  const result = await prisma.financialRecord.updateMany({
    where: { id, ...whereActive() },
    data: { deletedAt: new Date() },
  });

  if (result.count === 0) {
    throw new AppError(404, 'Financial record not found.');
  }
  await invalidateDashboardCache();
}
