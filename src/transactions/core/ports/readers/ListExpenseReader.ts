import { Result } from '@/shared/base';
import { ReportingPeriod } from '@/shared/ValueObjects';
import { ListExpenseResult } from '@/transactions/core/queries/ListExpense/ListExpense.result';

export type ListExpenseReaderInput = {
  period: ReportingPeriod;
};

export abstract class ListExpenseReader {
  abstract read(input: ListExpenseReaderInput): Promise<Result<ListExpenseResult[]>>;
}
