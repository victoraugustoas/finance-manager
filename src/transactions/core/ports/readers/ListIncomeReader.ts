import { Result } from '@/shared/base';
import { ReportingPeriod } from '@/shared/ValueObjects';
import { ListIncomeResult } from '@/transactions/core/queries/ListIncome/ListIncome.result';

export type ListIncomeReaderInput = {
  period: ReportingPeriod;
};

export abstract class ListIncomeReader {
  abstract read(input: ListIncomeReaderInput): Promise<Result<ListIncomeResult[]>>;
}
