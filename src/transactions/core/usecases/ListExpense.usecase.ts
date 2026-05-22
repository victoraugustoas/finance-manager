import { Result, UseCase } from '@/shared/base';
import { ReportingPeriod } from '@/shared/ValueObjects';
import {
  ListExpenseQuery,
  ListExpenseQueryResult,
} from '@/transactions/core/provider/ListExpense.query';
import { endOfMonth, startOfMonth } from 'date-fns';

export type ListExpenseParams = {
  startDate?: Date;
  endDate?: Date;
};

export class ListExpenseUseCase implements UseCase<ListExpenseParams, ListExpenseQueryResult[]> {
  constructor(private readonly listExpenseQuery: ListExpenseQuery) {}

  async execute(params: ListExpenseParams = {}): Promise<Result<ListExpenseQueryResult[]>> {
    const today = new Date();
    const period = ReportingPeriod.create({
      startDate: params.startDate ?? startOfMonth(today),
      endDate: params.endDate ?? endOfMonth(today),
    });
    if (period.isFailure) {
      return period.asFail();
    }

    const expenses = await this.listExpenseQuery.execute({ period: period.value });
    if (expenses.isFailure) {
      return expenses.asFail();
    }

    return Result.ok(expenses.value);
  }
}
