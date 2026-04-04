import { Request, Response, NextFunction } from 'express';
import * as recordService from './record.service';
import { CreateRecordInput, UpdateRecordInput, ListQueryInput } from './record.schemas';
import { success, paginated } from '../../utils/response';

export async function create(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const record = await recordService.createRecord(
      req.user.id,
      req.body as CreateRecordInput,
    );
    success(res, record, 201);
  } catch (err) {
    next(err);
  }
}

export async function list(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { records, meta } = await recordService.listRecords(
      req.query as unknown as ListQueryInput,
    );
    paginated(res, records, meta);
  } catch (err) {
    next(err);
  }
}

export async function getById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const record = await recordService.getRecordById(req.params['id'] as string);
    success(res, record);
  } catch (err) {
    next(err);
  }
}

export async function update(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const record = await recordService.updateRecord(
      req.params['id'] as string,
      req.body as UpdateRecordInput,
    );
    success(res, record);
  } catch (err) {
    next(err);
  }
}

export async function softDelete(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await recordService.softDeleteRecord(req.params['id'] as string);
    success(res, { message: 'Record deleted successfully.' });
  } catch (err) {
    next(err);
  }
}
