import { Result } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';
import { PrismaService } from '@/shared/infra/PrismaService';
import {
  ListTransactionsQuery,
  ListTransactionsQueryProps,
  ListTransactionsQueryResult,
} from '@/accounts/core/provider/ListTransactions.query';
import { TransactionType } from 'generated/prisma/client';

export class PrismaListTransactionsQuery implements ListTransactionsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async execute(props: ListTransactionsQueryProps): Promise<Result<ListTransactionsQueryResult[]>> {
    try {
      const { accountId, period } = props;

      const [rawTransactions, rawTransfers] = await Promise.all([
        this.prisma.transaction.findMany({
          where: {
            accountId,
            effectivated: false,
            dueDate: { gte: period.startDate, lte: period.endDate },
          },
          select: { amount: true, type: true, dueDate: true },
        }),
        this.prisma.transfer.findMany({
          where: {
            OR: [{ accountIdOrigin: accountId }, { accountIdDestination: accountId }],
            effectivated: false,
            dueDate: { gte: period.startDate, lte: period.endDate },
          },
          select: { amount: true, accountIdOrigin: true, dueDate: true },
        }),
      ]);

      const results: ListTransactionsQueryResult[] = [
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
