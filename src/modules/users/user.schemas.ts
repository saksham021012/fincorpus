import { z } from 'zod';
import { Role, Status } from '@prisma/client';

export const updateRoleSchema = z.object({
  role: z.nativeEnum(Role, {
    errorMap: () => ({ message: 'Invalid role. Must be VIEWER, ANALYST, or ADMIN.' }),
  }),
});

export const updateStatusSchema = z.object({
  status: z.nativeEnum(Status, {
    errorMap: () => ({ message: 'Invalid status. Must be ACTIVE or INACTIVE.' }),
  }),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
