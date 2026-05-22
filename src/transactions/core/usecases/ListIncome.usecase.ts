import { Result, UseCase } from '@/shared/base';
import { ReportingPeriod } from '@/shared/ValueObjects';
import {
  ListIncomeQuery,
  ListIncomeQueryResult,
} from '@/transactions/core/provider/ListIncome.query';
import { endOfMonth, startOfMonth } from 'date-fns';

export type ListIncomeParams = {
  startDate?: Date;
  endDate?: Date;
};

export class ListIncomeUseCase implements UseCase<ListIncomeParams, ListIncomeQueryResult[]> {
  constructor(private readonly listIncomeQuery: ListIncomeQuery) {}

  async execute(params: ListIncomeParams = {}): Promise<Result<ListIncomeQueryResult[]>> {
    const today = new Date();
    const period = ReportingPeriod.create({
      startDate: params.startDate ?? startOfMonth(today),
      endDate: params.endDate ?? endOfMonth(today),
    });
    if (period.isFailure) {
      return period.asFail();
    }

    const incomes = await this.listIncomeQuery.execute({ period: period.value });
    if (incomes.isFailure) {
      return incomes.asFail();
    }

    return Result.ok(incomes.value);
  }
}
