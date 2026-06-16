import { AccountsRepository } from '@/accounts/core/ports/repositories/Accounts.repository';
import { QueryHandler, Result } from '@/shared/base';
import { ListTransactionsReader } from '@/accounts/core/ports/readers/ListTransactionsReader';
import { AccountBalanceCalculatorService } from '@/accounts/core/service/AccountBalanceCalculator.service';
import { endOfDay } from 'date-fns';

import { ListAccountsQuery } from './ListAccounts.query';
import { ListAccountsResult } from './ListAccounts.result';

export class ListAccountsHandler implements QueryHandler<ListAccountsQuery, ListAccountsResult[]> {
  private readonly accountBalanceCalculator = new AccountBalanceCalculatorService();

  constructor(
    private readonly accountsRepository: AccountsRepository,
    private readonly listTransactionsReader: ListTransactionsReader,
  ) {}

  async handle(query: ListAccountsQuery): Promise<Result<ListAccountsResult[]>> {
    const endDate = endOfDay(query.endDate);
    const accounts = await this.accountsRepository.findAll();
    if (accounts.isFailure) {
      return accounts.asFail();
    }

    const listedAccounts = await Promise.all(
      accounts.value.map(async (account) => {
        const [transactionsEffectivated, allTransactions] = await Promise.all([
          this.listTransactionsReader.listTransactionsToEndDate({
            accountId: account.id,
            effectivated: true,
            endDate,
          }),
          this.listTransactionsReader.listTransactionsToEndDate({
            accountId: account.id,
            endDate,
          }),
        ]);

        const combinedResults = Result.combine([transactionsEffectivated, allTransactions]);
        if (combinedResults.isFailure) return combinedResults.asFail();

        return Result.ok({
          account,
          balance: this.accountBalanceCalculator.calculate(account, transactionsEffectivated.value),
          estimatedBalance: this.accountBalanceCalculator.calculate(account, allTransactions.value),
        });
      }),
    );

    const combined = Result.combine(listedAccounts);
    if (combined.isFailure) return combined.asFail();

    return Result.ok(listedAccounts.map((result) => result.value));
  }
}
