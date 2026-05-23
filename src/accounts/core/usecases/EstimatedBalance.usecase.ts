import { Result, UseCase } from '@/shared/base';
import { Money, ReportingPeriod, ReportingPeriodProps } from '@/shared/ValueObjects';
import { AccountsRepository } from '@/accounts/core/provider/accounts.repository';
import { ListTransactionsQuery } from '@/accounts/core/provider/ListTransactions.query';
import { EstimatedBalanceService } from '@/accounts/core/service/EstimatedBalance.service';
import { endOfMonth } from 'date-fns';

export interface EstimatedBalanceParams extends Partial<ReportingPeriodProps> {
  accountId: string;
}

export type EstimatedBalanceResult = {
  estimatedBalance: Money;
};

export class EstimatedBalanceUseCase implements UseCase<
  EstimatedBalanceParams,
  EstimatedBalanceResult
> {
  private readonly estimatedBalanceService = new EstimatedBalanceService();

  constructor(
    private readonly accountsRepository: AccountsRepository,
    private readonly listTransactionsQuery: ListTransactionsQuery,
  ) {}

  async execute(params: EstimatedBalanceParams): Promise<Result<EstimatedBalanceResult>> {
    const today = new Date();
    const periodResult = ReportingPeriod.create({
      startDate: params.startDate ?? today,
      endDate: params.endDate ?? endOfMonth(today),
    });
    if (periodResult.isFailure) return periodResult.asFail();

    const accountResult = await this.accountsRepository.findById(params.accountId);
    if (accountResult.isFailure) return accountResult.asFail();

    const transactionsResult = await this.listTransactionsQuery.execute({
      accountId: params.accountId,
      period: periodResult.value,
    });
    if (transactionsResult.isFailure) return transactionsResult.asFail();

    const estimatedBalance = this.estimatedBalanceService.calculate(
      accountResult.value,
      transactionsResult.value,
    );

    return Result.ok({ estimatedBalance });
  }
}
