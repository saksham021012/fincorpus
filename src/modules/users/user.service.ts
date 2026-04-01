import { prisma } from '../../config/database';
import { AppError } from '../../utils/AppError';
import { UpdateRoleInput, UpdateStatusInput } from './user.schemas';

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  createdAt: true,
};

export async function getUsers() {
  return await prisma.user.findMany({
    select: USER_SELECT,
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateRole(
  currentUserId: string,
  targetUserId: string,
  input: UpdateRoleInput,
) {
  if (currentUserId === targetUserId) {
    throw new AppError(403, 'You cannot modify your own role.');
  }

  // Note: if targetUserId doesn't exist, Prisma throws P2025
  // which is correctly handled by our global errorHandler mapped to 404 Not Found.
  return await prisma.user.update({
    where: { id: targetUserId },
    data: { role: input.role },
    select: USER_SELECT,
  });
}

export async function updateStatus(
  currentUserId: string,
  targetUserId: string,
  input: UpdateStatusInput,
) {
  if (currentUserId === targetUserId) {
    throw new AppError(403, 'You cannot modify your own status.');
  }

  return await prisma.user.update({
    where: { id: targetUserId },
    data: { status: input.status },
    select: USER_SELECT,
  });
}
