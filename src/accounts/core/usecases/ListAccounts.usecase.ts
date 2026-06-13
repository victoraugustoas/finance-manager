import { Account } from '@/accounts/core/model/Account';
import { AccountsRepository } from '@/accounts/core/provider/accounts.repository';
import { Result, UseCase } from '@/shared/base';
import { ListTransactionsQuery } from '@/accounts/core/provider/ListTransactions.query';
import { Money } from '@/shared/ValueObjects';
import { AccountBalanceCalculatorService } from '@/accounts/core/service/AccountBalanceCalculator.service';

export type ListAccountsParams = Record<string, never>;

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

  async execute(_params: ListAccountsParams = {}): Promise<Result<ListedAccount[]>> {
    const accounts = await this.accountsRepository.findAll();
    if (accounts.isFailure) {
      return accounts.asFail();
    }

    const listedAccounts = await Promise.all(
      accounts.value.map(async (account) => {
        const transactions = await this.listTransactionsQuery.execute({
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
