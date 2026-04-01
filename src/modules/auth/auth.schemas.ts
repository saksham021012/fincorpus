import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email is required.' })
    .email('Must be a valid email address.')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(8, 'Password must be at least 8 characters.'),
  name: z
    .string({ required_error: 'Name is required.' })
    .min(1, 'Name cannot be empty.')
    .trim(),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required.' })
    .email('Must be a valid email address.')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(1, 'Password is required.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
