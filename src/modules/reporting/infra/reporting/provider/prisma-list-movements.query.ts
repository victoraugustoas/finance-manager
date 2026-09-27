import { Result } from '@/shared/base/result';
import { RepositoryErrors } from '@/shared/errors/shared-errors';
import { PrismaService } from '@/shared/infra/prisma.service';
import { ListMovementsQuery, ListMovementsQueryInput, MovementOutDTO } from '@/modules/reporting';
import { TransactionType } from 'generated/prisma/client';

export class PrismaListMovementsQuery implements ListMovementsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: ListMovementsQueryInput): Promise<Result<MovementOutDTO[]>> {
    const { accountId, effectivated, period, dueUntil } = input;
    const dueDate = period
      ? { gte: period.startDate, lte: period.endDate }
      : dueUntil
        ? { lte: dueUntil }
        : undefined;

    try {
      const [transactions, transfers] = await Promise.all([
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

      const movements: MovementOutDTO[] = [
        ...transactions.map((row) => ({
          id: row.id,
          movementType:
            row.type === TransactionType.INCOME ? ('INCOME' as const) : ('EXPENSE' as const),
          name: row.name,
          amountInCents: row.amount,
          dueDate: row.dueDate,
          entryDate: row.entryDate,
          effectivated: row.effectivated,
          effectivatedDate: row.effectivatedDate,
          notes: row.notes,
          account: row.account,
          category: row.category,
          subCategory: row.subCategory,
        })),
        ...transfers.map((row) => ({
          id: row.id,
          movementType:
            row.accountIdOrigin === accountId
              ? ('TRANSFER_OUT' as const)
              : ('TRANSFER_IN' as const),
          name: row.name,
          amountInCents: row.amount,
          dueDate: row.dueDate,
          entryDate: row.entryDate,
          effectivated: row.effectivated,
          effectivatedDate: row.effectivatedDate,
          notes: row.notes,
          originAccount: row.accountOrigin,
          destinationAccount: row.accountDestination,
        })),
      ];

      return Result.ok(movements);
    } catch {
      return Result.fail(RepositoryErrors.READ_FAILED);
    }
  }
}
