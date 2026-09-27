import { Result } from '@/shared/base/result';
import { Transfer } from '../model';

export interface TransferRepository {
  create(entity: Transfer): Promise<Result<void>>;
  update(entity: Transfer): Promise<Result<void>>;
  /** Fails with `ENTITY_NOT_FOUND` when there is no transfer with the given id. */
  findById(id: string): Promise<Result<Transfer>>;
  delete(id: string): Promise<Result<void>>;
}
