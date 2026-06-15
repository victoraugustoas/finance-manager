import { Account } from '@/accounts/core/model/Account';
import { AccountsRepository } from '@/accounts/core/ports/repositories/Accounts.repository';
import { QueryHandler, Result } from '@/shared/base';
import { ListTransactionsReader } from '@/accounts/core/ports/readers/ListTransactionsReader';
import { AccountBalanceCalculatorService } from '@/accounts/core/service/AccountBalanceCalculator.service';
import { endOfDay } from 'date-fns';

import { ListAccountsQuery } from './ListAccounts.query';
import { ListAccountsResult } from './ListAccounts.result';

export class ListAccountsHandler implements QueryHandler<ListAccountsQuery | undefined, ListAccountsResult[]> {
  private readonly accountBalanceCalculator = new AccountBalanceCalculatorService();

  constructor(
    private readonly accountsRepository: AccountsRepository,
    private readonly listTransactionsReader: ListTransactionsReader,
  ) {}

  async handle(query: ListAccountsQuery = {}): Promise<Result<ListAccountsResult[]>> {
    const accounts = await this.accountsRepository.findAll();
    if (accounts.isFailure) {
      return accounts.asFail();
    }

    const listedAccounts = await Promise.all(
      accounts.value.map(async (account) => {
        const transactions =
          query.endDate !== undefined
            ? await this.listTransactionsReader.listTransactionsToEndDate({
                accountId: account.id,
                effectivated: true,
                endDate: endOfDay(query.endDate),
              })
            : await this.listTransactionsReader.listTransactions({
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
