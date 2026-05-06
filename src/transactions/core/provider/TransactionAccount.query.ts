import { Result } from '@/shared/base';

export abstract class TransactionAccountQuery {
  abstract existsById(accountId: string): Promise<Result<void>>;
}
