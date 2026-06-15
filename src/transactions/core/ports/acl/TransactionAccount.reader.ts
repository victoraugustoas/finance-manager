import { Result } from '@/shared/base';

export abstract class TransactionAccountReader {
  abstract existsById(accountId: string): Promise<Result<void>>;
}
