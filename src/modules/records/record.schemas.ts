import { z } from 'zod';
import { RecordType } from '@prisma/client';

export const createRecordSchema = z.object({
  amount: z
    .number({ required_error: 'Amount is required.' })
    .positive('Amount must be a positive number.'),
  type: z.nativeEnum(RecordType, {
    errorMap: () => ({ message: 'Type must be INCOME or EXPENSE.' }),
  }),
  category: z
    .string({ required_error: 'Category is required.' })
    .min(1, 'Category cannot be empty.')
    .trim(),
  date: z.coerce.date({ required_error: 'Date is required.' }),
  description: z
    .string({ required_error: 'Description is required.' })
    .min(1, 'Description cannot be empty.')
    .trim(),
});

export const updateRecordSchema = z.object({
  amount: z.number().positive('Amount must be a positive number.').optional(),
  type: z
    .nativeEnum(RecordType, {
      errorMap: () => ({ message: 'Type must be INCOME or EXPENSE.' }),
    })
    .optional(),
  category: z.string().min(1, 'Category cannot be empty.').trim().optional(),
  date: z.coerce.date().optional(),
  description: z
    .string()
    .min(1, 'Description cannot be empty.')
    .trim()
    .optional(),
});

export const listQuerySchema = z.object({
  type: z
    .nativeEnum(RecordType, {
      errorMap: () => ({ message: 'Type must be INCOME or EXPENSE.' }),
    })
    .optional(),
  category: z.string().trim().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().trim().optional(),
  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(20),
  sortBy: z
    .enum(['date', 'amount', 'createdAt'])
    .default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
export type ListQueryInput = z.infer<typeof listQuerySchema>;
