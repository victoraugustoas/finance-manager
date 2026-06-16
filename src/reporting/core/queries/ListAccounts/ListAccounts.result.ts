import { ListAccountsReaderResult } from '@/reporting/core/ports/readers/ListAccountsReader';
import { Money } from '@/shared/ValueObjects';

export type ListAccountsResult = {
  account: ListAccountsReaderResult;
  balance: Money;
  estimatedBalance: Money;
};
