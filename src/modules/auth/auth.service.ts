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

function generateTokens(userId: string, role: Role) {
  const accessToken = jwt.sign({ userId, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
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

  const tokens = generateTokens(user.id, user.role);

  return { ...tokens, user };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { ...USER_SELECT, passwordHash: true },
  });

  const invalidCredentials = new AppError(401, 'Invalid email or password.');

  if (!user) throw invalidCredentials;

  const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatch) throw invalidCredentials;

  if (user.status === 'INACTIVE') {
    throw new AppError(403, 'Your account has been deactivated. Contact an admin.');
  }

  const { passwordHash: _, ...userWithoutPassword } = user;
  const tokens = generateTokens(user.id, user.role);

  return { ...tokens, user: userWithoutPassword };
}

export async function refreshAccess(refreshToken: string) {
  let payload: { userId: string };
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string };
  } catch {
    throw new AppError(401, 'Invalid or expired refresh token.');
  }

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

  const tokens = generateTokens(user.id, user.role);

  return tokens;
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
