import { Result } from '@/shared/base/result';
import { Account } from '../model';

export interface AccountRepository {
  create(entity: Account): Promise<Result<void>>;
  update(entity: Account): Promise<Result<void>>;
  /** Fails with `ENTITY_NOT_FOUND` when there is no account with the given id. */
  findById(id: string): Promise<Result<Account>>;
  delete(id: string): Promise<Result<void>>;
}
