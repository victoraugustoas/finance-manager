import { ListAccountsReader } from '@/reporting/core/ports/readers/ListAccountsReader';
import { AccountBalanceCalculatorService } from '@/reporting/core/service/AccountBalanceCalculator/AccountBalanceCalculator.service';
import { QueryHandler, Result } from '@/shared/base';
import { endOfDay } from 'date-fns';

import { ListAccountsQuery } from './ListAccounts.query';
import { ListAccountsResult } from './ListAccounts.result';

export class ListAccountsHandler implements QueryHandler<ListAccountsQuery, ListAccountsResult[]> {
  constructor(
    private readonly listAccountsReader: ListAccountsReader,
    private readonly accountBalanceCalculator: AccountBalanceCalculatorService,
  ) {}

  async handle(query: ListAccountsQuery): Promise<Result<ListAccountsResult[]>> {
    const endDate = endOfDay(query.endDate);
    const accounts = await this.listAccountsReader.read();
    if (accounts.isFailure) {
      return accounts.asFail();
    }

    const listedAccounts = await Promise.all(
      accounts.value.map(async (account) => {
        const balance = await this.accountBalanceCalculator.calculate({
          accountId: account.id,
          endDate,
        });

        if (balance.isFailure) {
          return balance.asFail();
        }

        return Result.ok({ account, ...balance.value });
      }),
    );

    const combined = Result.combine(listedAccounts);
    if (combined.isFailure) return combined.asFail();

    return Result.ok(listedAccounts.map((result) => result.value));
  }
}
