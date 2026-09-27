import { Result } from '@/shared/base/result';
import { RepositoryErrors } from '@/shared/errors/shared-errors';
import { PrismaService } from '@/shared/infra/prisma.service';
import { ReportingPeriod } from '@/shared/ValueObjects/reporting-period.vo';
import {
  ListTransactionsQueryInDTO,
  ListTransfersQuery,
  TransferListItemOutDTO,
} from '@/modules/transaction';

export class PrismaListTransfersQuery implements ListTransfersQuery {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: ListTransactionsQueryInDTO): Promise<Result<TransferListItemOutDTO[]>> {
    const period = ReportingPeriod.tryCreateWithCurrentMonthFallback(input);
    if (period.isFailure) {
      return period.withFail;
    }

    try {
      const rows = await this.prisma.transfer.findMany({
        where: {
          entryDate: {
            gte: period.instance.startDate,
            lte: period.instance.endDate,
          },
        },
        include: { accountOrigin: true, accountDestination: true },
        orderBy: { entryDate: 'desc' },
      });

      return Result.ok(
        rows.map((row) => ({
          id: row.id,
          name: row.name,
          amount: row.amount / 100,
          notes: row.notes ?? undefined,
          dueDate: row.dueDate,
          entryDate: row.entryDate,
          effectivatedDate: row.effectivatedDate ?? undefined,
          effectivated: row.effectivated,
          accountIdOrigin: row.accountIdOrigin,
          accountOriginName: row.accountOrigin.name,
          accountIdDestination: row.accountIdDestination,
          accountDestinationName: row.accountDestination.name,
        })),
      );
    } catch {
      return Result.fail(RepositoryErrors.READ_FAILED);
    }
  }
}
