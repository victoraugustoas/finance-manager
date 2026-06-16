import { Result } from '@/shared/base';
import { ReportingPeriod } from '@/shared/ValueObjects';

export type ListTransactionsByAccountQueryProps = {
  accountId: string;
  period?: ReportingPeriod;
  effectivated?: boolean;
};

export type ListTransactionsToEndDateQueryProps = Omit<
  ListTransactionsByAccountQueryProps,
  'period'
> & {
  endDate: Date;
};

export type TransactionMovementType = 'INCOME' | 'EXPENSE' | 'TRANSFER_IN' | 'TRANSFER_OUT';

export type ListTransactionsReaderResult = {
  amountInCents: number;
  movementType: TransactionMovementType;
  dueDate: Date;
};

export abstract class ListTransactionsReader {
  abstract listTransactions(
    props: ListTransactionsByAccountQueryProps,
  ): Promise<Result<ListTransactionsReaderResult[]>>;

  abstract listTransactionsToEndDate(
    props: ListTransactionsToEndDateQueryProps,
  ): Promise<Result<ListTransactionsReaderResult[]>>;
}
