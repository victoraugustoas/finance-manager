import {
  StatementReader,
  StatementReaderMovement,
} from '@/reporting/core/ports/readers/StatementReader';
import { QueryHandler, Result } from '@/shared/base';
import { ReportingPeriod, Money } from '@/shared/ValueObjects';
import { endOfDay, isAfter, isBefore, isSameDay, startOfDay } from 'date-fns';

import { StatementQuery } from './Statement.query';
import { StatementDayResult, StatementEntryResult, StatementResult } from './Statement.result';

export class StatementHandler implements QueryHandler<StatementQuery, StatementResult> {
  constructor(private readonly statementReader: StatementReader) {}

  async handle(query: StatementQuery): Promise<Result<StatementResult>> {
    const period = ReportingPeriod.create({
      startDate: startOfDay(query.startDate),
      endDate: endOfDay(query.endDate),
    });
    if (period.isFailure) {
      return period.asFail();
    }

    const readerResult = await this.statementReader.read({
      accountId: query.accountId,
      endDate: period.value.endDate,
    });
    if (readerResult.isFailure) {
      return readerResult.asFail();
    }

    const today = startOfDay(new Date());
    const startDate = startOfDay(period.value.startDate);
    const endDate = endOfDay(period.value.endDate);
    let runningBalance = readerResult.value.accounts.reduce(
      (balance, account) => balance.add(account.openingBalance),
      Money.fromCents(0).value,
    );

    const movements = [...readerResult.value.movements].sort((left, right) => {
      const dueDateComparison = left.dueDate.getTime() - right.dueDate.getTime();
      if (dueDateComparison !== 0) return dueDateComparison;
      return left.name.localeCompare(right.name, 'pt-BR');
    });

    for (const movement of movements) {
      const movementDay = startOfDay(movement.dueDate);
      if (!isBefore(movementDay, startDate)) continue;

      if (movement.effectivated || !isBefore(movementDay, today)) {
        runningBalance = runningBalance.add(movement.balanceImpactAmount);
      }
    }

    const initialBalance = runningBalance;
    const movementsInPeriod = movements.filter((movement) => {
      const movementDay = startOfDay(movement.dueDate);
      return !isBefore(movementDay, startDate) && !isAfter(movementDay, endDate);
    });
    const movementsByDay = this.groupMovementsByDay(movementsInPeriod);
    const days: StatementDayResult[] = [];

    for (const [dateKey, dayMovements] of movementsByDay) {
      const day = startOfDay(new Date(`${dateKey}T00:00:00.000Z`));
      const entries: StatementEntryResult[] = dayMovements.map((movement) => {
        const includedInBalance = this.shouldIncludeInBalance(movement, day, today);
        if (includedInBalance) {
          runningBalance = runningBalance.add(movement.balanceImpactAmount);
        }

        return {
          id: movement.id,
          kind: movement.kind,
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
            direction: this.toBalanceImpactDirection(movement.balanceImpactAmount),
            amount: movement.balanceImpactAmount,
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

  private groupMovementsByDay(
    movements: StatementReaderMovement[],
  ): Map<string, StatementReaderMovement[]> {
    return movements.reduce((groups, movement) => {
      const key = movement.dueDate.toISOString().slice(0, 10);
      const current = groups.get(key) ?? [];
      current.push(movement);
      groups.set(key, current);
      return groups;
    }, new Map<string, StatementReaderMovement[]>());
  }

  private shouldIncludeInBalance(
    movement: StatementReaderMovement,
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

  private toBalanceImpactDirection(amount: Money): 'IN' | 'OUT' | 'NEUTRAL' {
    if (amount.amountInCents > 0) return 'IN';
    if (amount.amountInCents < 0) return 'OUT';
    return 'NEUTRAL';
  }
}
