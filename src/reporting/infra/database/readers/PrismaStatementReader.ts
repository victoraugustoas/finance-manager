import {
  StatementReader,
  StatementReaderInput,
  StatementReaderMovement,
  StatementReaderResult,
} from '@/reporting/core/ports/readers/StatementReader';
import { Result } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';
import { PrismaService } from '@/shared/infra/PrismaService';
import { Money } from '@/shared/ValueObjects';
import { TransactionType } from 'generated/prisma/client';

export class PrismaStatementReader implements StatementReader {
  constructor(private readonly prisma: PrismaService) {}

  async read(input: StatementReaderInput): Promise<Result<StatementReaderResult>> {
    try {
      const accounts = await this.prisma.account.findMany({
        where: input.accountId ? { id: input.accountId } : undefined,
        select: { id: true, name: true, openingBalance: true },
        orderBy: { name: 'asc' },
      });
      const selectedAccountIds = accounts.map((account) => account.id);

      if (selectedAccountIds.length === 0) {
        return Result.ok({ accounts: [], movements: [] });
      }

      const [transactions, transfers] = await Promise.all([
        this.prisma.transaction.findMany({
          where: {
            accountId: { in: selectedAccountIds },
            dueDate: { lte: input.endDate },
          },
          select: {
            id: true,
            name: true,
            amount: true,
            notes: true,
            dueDate: true,
            entryDate: true,
            effectivatedDate: true,
            effectivated: true,
            type: true,
            account: { select: { id: true, name: true } },
            category: { select: { id: true, name: true } },
            subCategory: { select: { id: true, name: true } },
          },
          orderBy: [{ dueDate: 'asc' }, { name: 'asc' }, { id: 'asc' }],
        }),
        this.prisma.transfer.findMany({
          where: {
            OR: input.accountId
              ? [{ accountIdOrigin: input.accountId }, { accountIdDestination: input.accountId }]
              : [
                  { accountIdOrigin: { in: selectedAccountIds } },
                  { accountIdDestination: { in: selectedAccountIds } },
                ],
            dueDate: { lte: input.endDate },
          },
          select: {
            id: true,
            name: true,
            amount: true,
            notes: true,
            dueDate: true,
            entryDate: true,
            effectivatedDate: true,
            effectivated: true,
            accountIdOrigin: true,
            accountIdDestination: true,
            accountOrigin: { select: { id: true, name: true } },
            accountDestination: { select: { id: true, name: true } },
          },
          orderBy: [{ dueDate: 'asc' }, { name: 'asc' }, { id: 'asc' }],
        }),
      ]);

      const selectedAccountIdSet = new Set(selectedAccountIds);
      const movements: StatementReaderMovement[] = [
        ...transactions.map((transaction) => {
          const amount = Money.fromCents(transaction.amount).value;
          return {
            id: transaction.id,
            kind:
              transaction.type === TransactionType.INCOME
                ? ('INCOME' as const)
                : ('EXPENSE' as const),
            name: transaction.name,
            amount,
            dueDate: transaction.dueDate,
            entryDate: transaction.entryDate,
            effectivated: transaction.effectivated,
            effectivatedDate: transaction.effectivatedDate,
            notes: transaction.notes,
            account: transaction.account,
            category: transaction.category,
            subCategory: transaction.subCategory,
            balanceImpactAmount:
              transaction.type === TransactionType.INCOME
                ? amount
                : Money.fromCents(transaction.amount * -1).value,
          };
        }),
        ...transfers.map((transfer) => {
          const amount = Money.fromCents(transfer.amount).value;
          return {
            id: transfer.id,
            kind: 'TRANSFER' as const,
            name: transfer.name,
            amount,
            dueDate: transfer.dueDate,
            entryDate: transfer.entryDate,
            effectivated: transfer.effectivated,
            effectivatedDate: transfer.effectivatedDate,
            notes: transfer.notes,
            originAccount: transfer.accountOrigin,
            destinationAccount: transfer.accountDestination,
            balanceImpactAmount: this.getTransferBalanceImpactAmount({
              amountInCents: transfer.amount,
              originAccountId: transfer.accountIdOrigin,
              destinationAccountId: transfer.accountIdDestination,
              selectedAccountIdSet,
              accountId: input.accountId,
            }),
          };
        }),
      ].sort((left, right) => {
        const dueDateComparison = left.dueDate.getTime() - right.dueDate.getTime();
        if (dueDateComparison !== 0) return dueDateComparison;
        const nameComparison = left.name.localeCompare(right.name, 'pt-BR');
        if (nameComparison !== 0) return nameComparison;
        return left.id.localeCompare(right.id);
      });

      return Result.ok({
        accounts: accounts.map((account) => ({
          id: account.id,
          name: account.name,
          openingBalance: Money.fromCents(account.openingBalance).value,
        })),
        movements,
      });
    } catch (e) {
      return Result.fail({
        code: Errors.PRISMA_QUERY_ERROR,
        cls: this.constructor.name,
        data: { error: String(e) },
      });
    }
  }

  private getTransferBalanceImpactAmount(input: {
    amountInCents: number;
    originAccountId: string;
    destinationAccountId: string;
    selectedAccountIdSet: Set<string>;
    accountId?: string;
  }): Money {
    if (input.accountId) {
      return Money.fromCents(
        input.originAccountId === input.accountId ? input.amountInCents * -1 : input.amountInCents,
      ).value;
    }

    const originSelected = input.selectedAccountIdSet.has(input.originAccountId);
    const destinationSelected = input.selectedAccountIdSet.has(input.destinationAccountId);

    if (originSelected && destinationSelected) {
      return Money.fromCents(0).value;
    }

    if (originSelected) {
      return Money.fromCents(input.amountInCents * -1).value;
    }

    if (destinationSelected) {
      return Money.fromCents(input.amountInCents).value;
    }

    return Money.fromCents(0).value;
  }
}
