import { Request, Response, NextFunction } from 'express';
import * as userService from './user.service';
import { success } from '../../utils/response';
import { UpdateRoleInput, UpdateStatusInput } from './user.schemas';

export async function list(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const users = await userService.getUsers();
    success(res, users);
  } catch (err) {
    next(err);
  }
}

export async function updateRole(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await userService.updateRole(
      req.user.id,
      req.params['id'] as string,
      req.body as UpdateRoleInput,
    );
    success(res, user);
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await userService.updateStatus(
      req.user.id,
      req.params['id'] as string,
      req.body as UpdateStatusInput,
    );
    success(res, user);
  } catch (err) {
    next(err);
  }
}
