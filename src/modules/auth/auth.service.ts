import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { RegisterInput, LoginInput } from './auth.schemas';

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  createdAt: true,
} as const;

function signToken(userId: string, role: Role): string {
  return jwt.sign({ userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existing) {
    throw new AppError(409, 'An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
    },
    select: USER_SELECT,
  });

  const token = signToken(user.id, user.role);

  return { token, user };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { ...USER_SELECT, passwordHash: true },
  });

  // Use the same error for both "not found" and "wrong password" to prevent email enumeration
  const invalidCredentials = new AppError(401, 'Invalid email or password.');

  if (!user) throw invalidCredentials;

  const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatch) throw invalidCredentials;

  if (user.status === 'INACTIVE') {
    throw new AppError(403, 'Your account has been deactivated. Contact an admin.');
  }

  const { passwordHash: _, ...userWithoutPassword } = user;
  const token = signToken(user.id, user.role);

  return { token, user: userWithoutPassword };
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_SELECT,
  });

  if (!user) {
    throw new AppError(404, 'User not found.');
  }

  return { user };
}
