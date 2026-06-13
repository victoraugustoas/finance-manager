import { Account } from '@/accounts/core/model/Account';
import { AccountsRepository } from '@/accounts/core/provider/accounts.repository';
import { Result, UseCase } from '@/shared/base';
import { ListTransactionsQuery } from '@/accounts/core/provider/ListTransactions.query';
import { Money } from '@/shared/ValueObjects';
import { AccountBalanceCalculatorService } from '@/accounts/core/service/AccountBalanceCalculator.service';
import { endOfDay } from 'date-fns';

export type ListAccountsParams = {
  endDate?: Date;
};

export type ListedAccount = {
  account: Account;
  balance: Money;
};

export class ListAccountsUseCase implements UseCase<ListAccountsParams, ListedAccount[]> {
  private readonly accountBalanceCalculator = new AccountBalanceCalculatorService();

  constructor(
    private readonly accountsRepository: AccountsRepository,
    private readonly listTransactionsQuery: ListTransactionsQuery,
  ) {}

  async execute(params: ListAccountsParams = {}): Promise<Result<ListedAccount[]>> {
    const accounts = await this.accountsRepository.findAll();
    if (accounts.isFailure) {
      return accounts.asFail();
    }

    const listedAccounts = await Promise.all(
      accounts.value.map(async (account) => {
        const transactions =
          params.endDate !== undefined
            ? await this.listTransactionsQuery.listTransactionsToEndDate({
                accountId: account.id,
                effectivated: true,
                endDate: endOfDay(params.endDate),
              })
            : await this.listTransactionsQuery.listTransactions({
                accountId: account.id,
                effectivated: true,
              });
        if (transactions.isFailure) return transactions.asFail();

        return Result.ok({
          account,
          balance: this.accountBalanceCalculator.calculate(account, transactions.value),
        });
      }),
    );

    const combined = Result.combine(listedAccounts);
    if (combined.isFailure) return combined.asFail();

    return Result.ok(listedAccounts.map((result) => result.value));
  }
}
