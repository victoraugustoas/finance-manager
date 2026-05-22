import { Result } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';
import { PrismaService } from '@/shared/infra/PrismaService';
import {
  ListTransfersQuery,
  ListTransfersQueryProps,
  ListTransfersQueryResult,
} from '@/transactions/core/provider/ListTransfers.query';

export class PrismaListTransfersQuery implements ListTransfersQuery {
  constructor(private readonly prisma: PrismaService) {}

  async execute(props: ListTransfersQueryProps): Promise<Result<ListTransfersQueryResult[]>> {
    try {
      const rawTransfers = await this.prisma.transfer.findMany({
        where: {
          entryDate: {
            gte: props.period.startDate,
            lte: props.period.endDate,
          },
        },
        include: {
          accountOrigin: true,
          accountDestination: true,
        },
        orderBy: { entryDate: 'desc' },
      });

      return Result.ok(
        rawTransfers.map((raw) => ({
          id: raw.id,
          name: raw.name,
          amount: raw.amount,
          notes: raw.notes ?? undefined,
          dueDate: raw.dueDate,
          entryDate: raw.entryDate,
          effectivatedDate: raw.effectivatedDate ?? undefined,
          effectivated: raw.effectivated,
          accountIdOrigin: raw.accountIdOrigin,
          accountOriginName: raw.accountOrigin.name,
          accountIdDestination: raw.accountIdDestination,
          accountDestinationName: raw.accountDestination.name,
        })),
      );
    } catch (e) {
      return Result.fail({
        code: Errors.PRISMA_QUERY_ERROR,
        cls: this.constructor.name,
        data: { error: String(e) },
      });
    }
  }
}
