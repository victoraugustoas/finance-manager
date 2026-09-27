import { Result } from '@/shared/base/result';
import { UseCase } from '@/shared/base/UseCase';
import { Money } from '@/shared/ValueObjects/money.vo';
import { endOfDay } from 'date-fns';
import { AccountWithBalanceOutDTO, FindAccountsWithBalanceInDTO } from '../dto';
import { ListAccountsQuery, ListMovementsQuery } from '../provider';
import { AccountBalanceCalculatorService } from '../service';

/**
 * Read use case by exception: it aggregates two distinct queries (accounts and their movements)
 * per account to produce settled and estimated balances, which a single stable SQL projection
 * would not deliver. No entity and no write repository are involved.
 */
export class FindAccountsWithBalance implements UseCase<
  FindAccountsWithBalanceInDTO,
  AccountWithBalanceOutDTO[]
> {
  constructor(
    private readonly listAccounts: ListAccountsQuery,
    private readonly listMovements: ListMovementsQuery,
    private readonly balanceCalculator: AccountBalanceCalculatorService,
  ) {}

  async execute(input: FindAccountsWithBalanceInDTO): Promise<Result<AccountWithBalanceOutDTO[]>> {
    const dueUntil = endOfDay(input.endDate);
    const accounts = await this.listAccounts.execute();
    if (accounts.isFailure) {
      return accounts.withFail;
    }

    const balances = await Promise.all(
      accounts.instance.map(async (account) => {
        const [settled, all] = await Promise.all([
          this.listMovements.execute({ accountId: account.id, effectivated: true, dueUntil }),
          this.listMovements.execute({ accountId: account.id, dueUntil }),
        ]);

        const movements = Result.combine([settled, all]);
        if (movements.isFailure) {
          return movements.withFail as Result<AccountWithBalanceOutDTO>;
        }

        const openingBalance = Money.fromCents(account.openingBalanceInCents);

        return Result.ok<AccountWithBalanceOutDTO>({
          account,
          balanceInCents: this.balanceCalculator.accumulate(openingBalance, settled.instance)
            .amountInCents,
          estimatedBalanceInCents: this.balanceCalculator.accumulate(openingBalance, all.instance)
            .amountInCents,
        });
      }),
    );

    const combined = Result.combine(balances);
    if (combined.isFailure) {
      return combined.withFail;
    }

    return Result.ok(balances.map((balance) => balance.instance));
  }
}
