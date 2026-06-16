import { Result } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';
import { PrismaService } from '@/shared/infra/PrismaService';
import {
  ListTransactionsByAccountQueryProps,
  ListTransactionsReader,
  ListTransactionsReaderResult,
  ListTransactionsToEndDateQueryProps,
} from '@/reporting/core/ports/readers/ListTransactionsReader';
import { Money } from '@/shared/ValueObjects';
import { TransactionType } from 'generated/prisma/client';

export class PrismaListTransactionsReader implements ListTransactionsReader {
  constructor(private readonly prisma: PrismaService) {}

  async listTransactions(
    props: ListTransactionsByAccountQueryProps,
  ): Promise<Result<ListTransactionsReaderResult[]>> {
    try {
      const { accountId, effectivated, period } = props;
      const dueDate = period ? { gte: period.startDate, lte: period.endDate } : undefined;

      const [rawTransactions, rawTransfers] = await Promise.all([
        this.prisma.transaction.findMany({
          where: {
            accountId,
            ...(effectivated !== undefined ? { effectivated } : {}),
            ...(dueDate ? { dueDate } : {}),
          },
          select: {
            id: true,
            name: true,
            amount: true,
            notes: true,
            dueDate: true,
            entryDate: true,
            effectivated: true,
            effectivatedDate: true,
            type: true,
            account: { select: { id: true, name: true } },
            category: { select: { id: true, name: true } },
            subCategory: { select: { id: true, name: true } },
          },
        }),
        this.prisma.transfer.findMany({
          where: {
            OR: [{ accountIdOrigin: accountId }, { accountIdDestination: accountId }],
            ...(effectivated !== undefined ? { effectivated } : {}),
            ...(dueDate ? { dueDate } : {}),
          },
          select: {
            id: true,
            name: true,
            amount: true,
            notes: true,
            dueDate: true,
            entryDate: true,
            effectivated: true,
            effectivatedDate: true,
            accountIdOrigin: true,
            accountOrigin: { select: { id: true, name: true } },
            accountDestination: { select: { id: true, name: true } },
          },
        }),
      ]);

      const results: ListTransactionsReaderResult[] = [
        ...rawTransactions.map((t) => ({
          id: t.id,
          movementType:
            t.type === TransactionType.INCOME ? ('INCOME' as const) : ('EXPENSE' as const),
          name: t.name,
          amount: Money.fromCents(t.amount).value,
          dueDate: t.dueDate,
          entryDate: t.entryDate,
          effectivated: t.effectivated,
          effectivatedDate: t.effectivatedDate,
          notes: t.notes,
          account: t.account,
          category: t.category,
          subCategory: t.subCategory,
        })),
        ...rawTransfers.map((t) => ({
          id: t.id,
          movementType:
            t.accountIdOrigin === accountId ? ('TRANSFER_OUT' as const) : ('TRANSFER_IN' as const),
          name: t.name,
          amount: Money.fromCents(t.amount).value,
          dueDate: t.dueDate,
          entryDate: t.entryDate,
          effectivated: t.effectivated,
          effectivatedDate: t.effectivatedDate,
          notes: t.notes,
          originAccount: t.accountOrigin,
          destinationAccount: t.accountDestination,
        })),
      ];

      return Result.ok(results);
    } catch (e) {
      return Result.fail({
        code: Errors.PRISMA_QUERY_ERROR,
        cls: this.constructor.name,
        data: { error: String(e) },
      });
    }
  }

  async listTransactionsToEndDate(
    props: ListTransactionsToEndDateQueryProps,
  ): Promise<Result<ListTransactionsReaderResult[]>> {
    try {
      const { accountId, effectivated, endDate } = props;

      const [rawTransactions, rawTransfers] = await Promise.all([
        this.prisma.transaction.findMany({
          where: {
            accountId,
            ...(effectivated !== undefined ? { effectivated } : {}),
            dueDate: { lte: endDate },
          },
          select: {
            id: true,
            name: true,
            amount: true,
            notes: true,
            dueDate: true,
            entryDate: true,
            effectivated: true,
            effectivatedDate: true,
            type: true,
            account: { select: { id: true, name: true } },
            category: { select: { id: true, name: true } },
            subCategory: { select: { id: true, name: true } },
          },
        }),
        this.prisma.transfer.findMany({
          where: {
            OR: [{ accountIdOrigin: accountId }, { accountIdDestination: accountId }],
            ...(effectivated !== undefined ? { effectivated } : {}),
            dueDate: { lte: endDate },
          },
          select: {
            id: true,
            name: true,
            amount: true,
            notes: true,
            dueDate: true,
            entryDate: true,
            effectivated: true,
            effectivatedDate: true,
            accountIdOrigin: true,
            accountOrigin: { select: { id: true, name: true } },
            accountDestination: { select: { id: true, name: true } },
          },
        }),
      ]);

      const results: ListTransactionsReaderResult[] = [
        ...rawTransactions.map((t) => ({
          id: t.id,
          movementType:
            t.type === TransactionType.INCOME ? ('INCOME' as const) : ('EXPENSE' as const),
          name: t.name,
          amount: Money.fromCents(t.amount).value,
          dueDate: t.dueDate,
          entryDate: t.entryDate,
          effectivated: t.effectivated,
          effectivatedDate: t.effectivatedDate,
          notes: t.notes,
          account: t.account,
          category: t.category,
          subCategory: t.subCategory,
        })),
        ...rawTransfers.map((t) => ({
          id: t.id,
          movementType:
            t.accountIdOrigin === accountId ? ('TRANSFER_OUT' as const) : ('TRANSFER_IN' as const),
          name: t.name,
          amount: Money.fromCents(t.amount).value,
          dueDate: t.dueDate,
          entryDate: t.entryDate,
          effectivated: t.effectivated,
          effectivatedDate: t.effectivatedDate,
          notes: t.notes,
          originAccount: t.accountOrigin,
          destinationAccount: t.accountDestination,
        })),
      ];

      return Result.ok(results);
    } catch (e) {
      return Result.fail({
        code: Errors.PRISMA_QUERY_ERROR,
        cls: this.constructor.name,
        data: { error: String(e) },
      });
    }
  }
}
