import { Result } from '@/shared/base';
import { Money } from '@/shared/ValueObjects';

export type ListAccountsReaderResult = {
  id: string;
  name: string;
  openingBalance: Money;
};

export abstract class ListAccountsReader {
  abstract read(): Promise<Result<ListAccountsReaderResult[]>>;
}
