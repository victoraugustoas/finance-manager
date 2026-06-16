import { QueryHandler, Result } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';
import { Money, ReportingPeriod } from '@/shared/ValueObjects';
import { isBefore, isSameDay, startOfDay } from 'date-fns';
import { StatementQuery } from './Statement.query';
import {
  StatementDayResult,
  StatementEntryMovementType,
  StatementEntryResult,
  StatementResult,
} from './Statement.result';
import {
  ListTransactionsReader,
  ListTransactionsReaderResult,
} from '@/reporting/core/ports/readers/ListTransactionsReader';
import { ListAccountsReader } from '@/reporting/core/ports/readers/ListAccountsReader';
import { AccountBalanceCalculatorService } from '@/reporting/core/service/AccountBalanceCalculator/AccountBalanceCalculator.service';

export class StatementHandler implements QueryHandler<StatementQuery, StatementResult> {
  constructor(
    private readonly listTransactionsReader: ListTransactionsReader,
    private readonly listAccountsReader: ListAccountsReader,
    private readonly accountBalanceCalculatorService: AccountBalanceCalculatorService,
  ) {}

  async handle(query: StatementQuery): Promise<Result<StatementResult>> {
    const period = ReportingPeriod.create({
      startDate: query.startDate,
      endDate: query.endDate,
    });
    if (period.isFailure) {
      return period.asFail();
    }

    const accounts = await this.listAccountsReader.read();
    if (accounts.isFailure) return accounts.asFail();

    const selectedAccounts = accounts.value.filter((account) => {
      if (query.accountId) {
        return query.accountId === account.id;
      }
      return true;
    });

    if (query.accountId && selectedAccounts.length === 0) {
      return Result.fail({
        code: Errors.REFERENCE_ACCOUNT_NOT_FOUND,
        cls: this.constructor.name,
        data: { accountId: query.accountId },
      });
    }

    const balanceResults = await Promise.all(
      selectedAccounts.map(async (account) => {
        const balance = await this.accountBalanceCalculatorService.calculate({
          accountId: account.id,
          endDate: period.value.endDate,
        });
        if (balance.isFailure) {
          return balance.asFail();
        }
        return Result.ok(balance.value.balance);
      }),
    );

    const balance = Result.combine(balanceResults);
    if (balance.isFailure) return balance.asFail();

    const today = startOfDay(new Date());
    const startDate = period.value.startDate;

    let runningBalance = balanceResults.reduce(
      (balance, accountBalance) => balance.add(accountBalance.value),
      Money.fromCents(0).value,
    );

    const movementResults = await Promise.all(
      selectedAccounts.map((account) =>
        this.listTransactionsReader.listTransactions({
          period: period.value,
          accountId: account.id,
        }),
      ),
    );

    const movement = Result.combine(movementResults);
    if (movement.isFailure) return movement.asFail();

    const movements = movementResults
      .flatMap((result) => result.value)
      .sort((left, right) => {
        const dueDateComparison = left.dueDate.getTime() - right.dueDate.getTime();
        if (dueDateComparison !== 0) return dueDateComparison;
        return left.name.localeCompare(right.name, 'pt-BR');
      });

    for (const movement of movements) {
      const movementDay = startOfDay(movement.dueDate);
      if (!isBefore(movementDay, startDate)) continue;

      if (movement.effectivated || !isBefore(movementDay, today)) {
        runningBalance = this.accountBalanceCalculatorService.accountBalanceCalculator(
          runningBalance,
          movement,
        );
      }
    }

    const initialBalance = runningBalance;
    const movementsByDay = this.groupTransactionsByDay(movements);
    const statementEntriesByDay = this.groupTransactionsByDay(
      this.deduplicateTransfersForStatementEntries(movements),
    );
    const days: StatementDayResult[] = [];

    for (const [dateKey, dayMovements] of statementEntriesByDay) {
      const day = startOfDay(new Date(`${dateKey}T00:00:00.000Z`));
      const balanceMovements = movementsByDay.get(dateKey) ?? [];
      for (const movement of balanceMovements) {
        if (this.shouldIncludeInBalance(movement, day, today)) {
          runningBalance = this.accountBalanceCalculatorService.accountBalanceCalculator(
            runningBalance,
            movement,
          );
        }
      }

      const entries: StatementEntryResult[] = dayMovements.map((movement) => {
        const includedInBalance = this.shouldIncludeInBalance(movement, day, today);

        return {
          id: movement.id,
          movementType: this.toStatementEntryMovementType(movement),
          name: movement.name,
          amount: movement.amount,
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
            amount: movement.amount,
          },
          includedInBalance,
        };
      });

      days.push({
        date: day,
        balance: runningBalance,
        entries,
      });
    }

    return Result.ok({
      startDate: period.value.startDate,
      endDate: period.value.endDate,
      accountId: query.accountId,
      initialBalance,
      finalBalance: runningBalance,
      days,
    });
  }

  private groupTransactionsByDay(
    transactions: ListTransactionsReaderResult[],
  ): Map<string, ListTransactionsReaderResult[]> {
    return transactions.reduce((groups, transaction) => {
      const key = transaction.dueDate.toISOString().slice(0, 10);
      const current = groups.get(key) ?? [];
      current.push(transaction);
      groups.set(key, current);
      return groups;
    }, new Map<string, ListTransactionsReaderResult[]>());
  }

  private deduplicateTransfersForStatementEntries(
    movements: ListTransactionsReaderResult[],
  ): ListTransactionsReaderResult[] {
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

  private toStatementEntryMovementType(
    movement: ListTransactionsReaderResult,
  ): StatementEntryMovementType {
    switch (movement.movementType) {
      case 'INCOME':
        return 'INCOME';
      case 'EXPENSE':
        return 'EXPENSE';
      default:
        return 'TRANSFER';
    }
  }

  private isTransfer(movement: ListTransactionsReaderResult): boolean {
    return movement.movementType === 'TRANSFER_IN' || movement.movementType === 'TRANSFER_OUT';
  }

  private shouldIncludeInBalance(
    movement: ListTransactionsReaderResult,
    day: Date,
    today: Date,
  ): boolean {
    if (isBefore(day, today)) {
      return movement.effectivated;
    }

    if (isSameDay(day, today)) {
      return true;
    }

    return true;
  }

  private toBalanceImpactDirection(
    transaction: ListTransactionsReaderResult,
  ): 'IN' | 'OUT' | 'NEUTRAL' {
    switch (transaction.movementType) {
      case 'EXPENSE':
        return 'OUT';
      case 'INCOME':
        return 'IN';
      default:
        return 'NEUTRAL';
    }
  }
}
