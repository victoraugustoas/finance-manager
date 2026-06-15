import { Result } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';
import { PrismaService } from '@/shared/infra/PrismaService';
import {
  ListTransactionsByAccountQueryProps,
  ListTransactionsReader,
  ListTransactionsReaderResult,
  ListTransactionsToEndDateQueryProps,
} from '@/accounts/core/ports/readers/ListTransactionsReader';
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
          select: { amount: true, type: true, dueDate: true },
        }),
        this.prisma.transfer.findMany({
          where: {
            OR: [{ accountIdOrigin: accountId }, { accountIdDestination: accountId }],
            ...(effectivated !== undefined ? { effectivated } : {}),
            ...(dueDate ? { dueDate } : {}),
          },
          select: { amount: true, accountIdOrigin: true, dueDate: true },
        }),
      ]);

      const results: ListTransactionsReaderResult[] = [
        ...rawTransactions.map((t) => ({
          amountInCents: t.amount,
          movementType:
            t.type === TransactionType.INCOME ? ('INCOME' as const) : ('EXPENSE' as const),
          dueDate: t.dueDate,
        })),
        ...rawTransfers.map((t) => ({
          amountInCents: t.amount,
          movementType:
            t.accountIdOrigin === accountId ? ('TRANSFER_OUT' as const) : ('TRANSFER_IN' as const),
          dueDate: t.dueDate,
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
          select: { amount: true, type: true, dueDate: true },
        }),
        this.prisma.transfer.findMany({
          where: {
            OR: [{ accountIdOrigin: accountId }, { accountIdDestination: accountId }],
            ...(effectivated !== undefined ? { effectivated } : {}),
            dueDate: { lte: endDate },
          },
          select: { amount: true, accountIdOrigin: true, dueDate: true },
        }),
      ]);

      const results: ListTransactionsReaderResult[] = [
        ...rawTransactions.map((t) => ({
          amountInCents: t.amount,
          movementType:
            t.type === TransactionType.INCOME ? ('INCOME' as const) : ('EXPENSE' as const),
          dueDate: t.dueDate,
        })),
        ...rawTransfers.map((t) => ({
          amountInCents: t.amount,
          movementType:
            t.accountIdOrigin === accountId ? ('TRANSFER_OUT' as const) : ('TRANSFER_IN' as const),
          dueDate: t.dueDate,
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
