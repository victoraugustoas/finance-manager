import { Result } from '@/shared/base';
import { Account } from '@/accounts/core/model/Account';

export abstract class AccountsRepository {
  abstract save(account: Account): Promise<Result<void>>;
  abstract findById(id: string): Promise<Result<Account>>;
}
