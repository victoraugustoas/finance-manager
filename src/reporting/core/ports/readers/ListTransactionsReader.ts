import { Result } from '@/shared/base';
import { Money, ReportingPeriod } from '@/shared/ValueObjects';

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
  id: string;
  movementType: TransactionMovementType;
  name: string;
  amount: Money;
  dueDate: Date;
  entryDate: Date;
  effectivated: boolean;
  effectivatedDate?: Date | null;
  notes?: string | null;
  account?: {
    id: string;
    name: string;
  };
  originAccount?: {
    id: string;
    name: string;
  };
  destinationAccount?: {
    id: string;
    name: string;
  };
  category?: {
    id: string;
    name: string;
  };
  subCategory?: {
    id: string;
    name: string;
  };
};

export abstract class ListTransactionsReader {
  abstract listTransactions(
    props: ListTransactionsByAccountQueryProps,
  ): Promise<Result<ListTransactionsReaderResult[]>>;

  abstract listTransactionsToEndDate(
    props: ListTransactionsToEndDateQueryProps,
  ): Promise<Result<ListTransactionsReaderResult[]>>;
}
