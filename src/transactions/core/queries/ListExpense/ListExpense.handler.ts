import { ListExpenseReader } from '@/transactions/core/ports/readers/ListExpenseReader';
import { ListExpenseQuery } from './ListExpense.query';
import { ListExpenseResult } from './ListExpense.result';
import { Result } from '@/shared/base';
import { ReportingPeriod } from '@/shared/ValueObjects';
import { endOfMonth, startOfMonth } from 'date-fns';

export class ListExpenseHandler {
  constructor(private readonly reader: ListExpenseReader) {}

  async handle(query: ListExpenseQuery = {}): Promise<Result<ListExpenseResult[]>> {
    const today = new Date();
    const period = ReportingPeriod.create({
      startDate: query.startDate ?? startOfMonth(today),
      endDate: query.endDate ?? endOfMonth(today),
    });
    if (period.isFailure) {
      return period.asFail();
    }
    const expenses = await this.reader.read({ period: period.value });
    if (expenses.isFailure) {
      return expenses.asFail();
    }
    return Result.ok(expenses.value);
  }
}
