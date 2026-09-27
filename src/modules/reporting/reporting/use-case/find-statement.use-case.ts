import { Result } from '@/shared/base/result';
import { UseCase } from '@/shared/base/UseCase';
import { Money } from '@/shared/ValueObjects/money.vo';
import { ReportingPeriod } from '@/shared/ValueObjects/reporting-period.vo';
import { isBefore, startOfDay } from 'date-fns';
import {
  FindStatementInDTO,
  MovementOutDTO,
  StatementBalanceImpactDirection,
  StatementDayOutDTO,
  StatementEntryMovementType,
  StatementEntryOutDTO,
  StatementOutDTO,
} from '../dto';
import { ListAccountsQuery, ListMovementsQuery, ReportingErrors } from '../provider';
import { AccountBalanceCalculatorService } from '../service';

/**
 * Read use case by exception: the statement combines the accounts query with one movements query
 * per account and folds a running balance day by day, which a single stable SQL projection would
 * not deliver. No entity and no write repository are involved.
 */
export class FindStatement implements UseCase<FindStatementInDTO, StatementOutDTO> {
  constructor(
    private readonly listAccounts: ListAccountsQuery,
    private readonly listMovements: ListMovementsQuery,
    private readonly balanceCalculator: AccountBalanceCalculatorService,
  ) {}

  async execute(input: FindStatementInDTO): Promise<Result<StatementOutDTO>> {
    const period = ReportingPeriod.tryCreate({
      startDate: input.startDate,
      endDate: input.endDate,
    });
    if (period.isFailure) {
      return period.withFail;
    }

    const accounts = await this.listAccounts.execute();
    if (accounts.isFailure) {
      return accounts.withFail;
    }

    const selectedAccounts = accounts.instance.filter((account) =>
      input.accountId ? input.accountId === account.id : true,
    );
    if (input.accountId && selectedAccounts.length === 0) {
      return Result.fail(ReportingErrors.ACCOUNT_NOT_FOUND);
    }

    const settledBalances = await Promise.all(
      selectedAccounts.map(async (account) => {
        const settled = await this.listMovements.execute({
          accountId: account.id,
          effectivated: true,
          dueUntil: period.instance.endDate,
        });
        if (settled.isFailure) {
          return settled.withFail as Result<Money>;
        }

        return Result.ok(
          this.balanceCalculator.accumulate(
            Money.fromCents(account.openingBalanceInCents),
            settled.instance,
          ),
        );
      }),
    );

    const balances = Result.combine(settledBalances);
    if (balances.isFailure) {
      return balances.withFail;
    }

    const movementResults = await Promise.all(
      selectedAccounts.map((account) =>
        this.listMovements.execute({
          accountId: account.id,
          period: {
            startDate: period.instance.startDate,
            endDate: period.instance.endDate,
          },
        }),
      ),
    );

    const movementsResult = Result.combine(movementResults);
    if (movementsResult.isFailure) {
      return movementsResult.withFail;
    }

    const movements = movementResults
      .flatMap((result) => result.instance)
      .sort((left, right) => {
        const dueDateComparison = left.dueDate.getTime() - right.dueDate.getTime();
        if (dueDateComparison !== 0) return dueDateComparison;
        return left.name.localeCompare(right.name, 'pt-BR');
      });

    const today = startOfDay(new Date());
    const startDate = period.instance.startDate;

    let runningBalance = settledBalances.reduce(
      (balance, accountBalance) => balance.add(accountBalance.instance),
      Money.fromCents(0),
    );

    for (const movement of movements) {
      const movementDay = startOfDay(movement.dueDate);
      if (!isBefore(movementDay, startDate)) continue;

      if (movement.effectivated || !isBefore(movementDay, today)) {
        runningBalance = this.balanceCalculator.applyMovement(runningBalance, movement);
      }
    }

    const initialBalance = runningBalance;
    const movementsByDay = this.groupMovementsByDay(movements);
    const entriesByDay = this.groupMovementsByDay(this.deduplicateTransfers(movements));
    const days: StatementDayOutDTO[] = [];

    for (const [dateKey, dayMovements] of entriesByDay) {
      const day = startOfDay(new Date(`${dateKey}T00:00:00.000Z`));

      for (const movement of movementsByDay.get(dateKey) ?? []) {
        if (this.shouldIncludeInBalance(movement, day, today)) {
          runningBalance = this.balanceCalculator.applyMovement(runningBalance, movement);
        }
      }

      const entries: StatementEntryOutDTO[] = dayMovements.map((movement) => ({
        id: movement.id,
        movementType: this.toEntryMovementType(movement),
        name: movement.name,
        amountInCents: movement.amountInCents,
        dueDate: movement.dueDate,
        entryDate: movement.entryDate,
        effectivated: movement.effectivated,
        effectivatedDate: movement.effectivatedDate,
        notes: movement.notes,
        account: movement.account,
        originAccount: movement.originAccount,
        destinationAccount: movement.destinationAccount,
        category: movement.category,
        subCategory: movement.subCategory,
        balanceImpact: {
          direction: this.toBalanceImpactDirection(movement),
          amountInCents: movement.amountInCents,
        },
        includedInBalance: this.shouldIncludeInBalance(movement, day, today),
      }));

      days.push({ date: day, balanceInCents: runningBalance.amountInCents, entries });
    }

    return Result.ok({
      startDate: period.instance.startDate,
      endDate: period.instance.endDate,
      accountId: input.accountId,
      initialBalanceInCents: initialBalance.amountInCents,
      finalBalanceInCents: runningBalance.amountInCents,
      days,
    });
  }

  private groupMovementsByDay(movements: MovementOutDTO[]): Map<string, MovementOutDTO[]> {
    return movements.reduce((groups, movement) => {
      const key = movement.dueDate.toISOString().slice(0, 10);
      const current = groups.get(key) ?? [];
      current.push(movement);
      groups.set(key, current);
      return groups;
    }, new Map<string, MovementOutDTO[]>());
  }

  /** A transfer between two selected accounts is read twice; the statement lists it once. */
  private deduplicateTransfers(movements: MovementOutDTO[]): MovementOutDTO[] {
    const transferIds = new Set<string>();

    return movements.filter((movement) => {
      if (!this.isTransfer(movement)) {
        return true;
      }
      if (transferIds.has(movement.id)) {
        return false;
      }

      transferIds.add(movement.id);
      return true;
    });
  }

  private toEntryMovementType(movement: MovementOutDTO): StatementEntryMovementType {
    switch (movement.movementType) {
      case 'INCOME':
        return 'INCOME';
      case 'EXPENSE':
        return 'EXPENSE';
      default:
        return 'TRANSFER';
    }
  }

  private isTransfer(movement: MovementOutDTO): boolean {
    return movement.movementType === 'TRANSFER_IN' || movement.movementType === 'TRANSFER_OUT';
  }

  /** Past days only count settled movements; today and future days count everything. */
  private shouldIncludeInBalance(movement: MovementOutDTO, day: Date, today: Date): boolean {
    return isBefore(day, today) ? movement.effectivated : true;
  }

  private toBalanceImpactDirection(movement: MovementOutDTO): StatementBalanceImpactDirection {
    switch (movement.movementType) {
      case 'EXPENSE':
        return 'OUT';
      case 'INCOME':
        return 'IN';
      default:
        return 'NEUTRAL';
    }
  }
}
