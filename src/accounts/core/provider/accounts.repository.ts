import { Result } from '@/shared/base';
import { Account } from '../model/Account';

export abstract class AccountsRepository {
  abstract create(account: Account): Promise<Result<void>>;
}
