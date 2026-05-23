import { Result } from '@/shared/base';
import { ReportingPeriod } from '@/shared/ValueObjects';

export type ListTransactionsQueryProps = {
  accountId: string;
  period: ReportingPeriod;
};

export type TransactionMovementType = 'INCOME' | 'EXPENSE' | 'TRANSFER_IN' | 'TRANSFER_OUT';

export type ListTransactionsQueryResult = {
  amountInCents: number;
  movementType: TransactionMovementType;
  dueDate: Date;
};

export abstract class ListTransactionsQuery {
  abstract execute(
    props: ListTransactionsQueryProps,
  ): Promise<Result<ListTransactionsQueryResult[]>>;
}
