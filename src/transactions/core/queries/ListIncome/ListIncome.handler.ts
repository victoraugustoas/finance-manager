import { ListIncomeReader } from '@/transactions/core/ports/readers/ListIncomeReader';
import { ListIncomeQuery } from './ListIncome.query';
import { ListIncomeResult } from './ListIncome.result';
import { Result } from '@/shared/base';
import { ReportingPeriod } from '@/shared/ValueObjects';
import { endOfMonth, startOfMonth } from 'date-fns';

export class ListIncomeHandler {
  constructor(private readonly reader: ListIncomeReader) {}

  async handle(query: ListIncomeQuery = {}): Promise<Result<ListIncomeResult[]>> {
    const today = new Date();
    const period = ReportingPeriod.create({
      startDate: query.startDate ?? startOfMonth(today),
      endDate: query.endDate ?? endOfMonth(today),
    });
    if (period.isFailure) {
      return period.asFail();
    }

    const incomes = await this.reader.read({ period: period.value });
    if (incomes.isFailure) {
      return incomes.asFail();
    }

    return Result.ok(incomes.value);
  }
}
