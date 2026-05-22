import { Result, UseCase } from '@/shared/base';
import { ReportingPeriod } from '@/shared/ValueObjects';
import {
  ListTransfersQuery,
  ListTransfersQueryResult,
} from '@/transactions/core/provider/ListTransfers.query';
import { endOfMonth, startOfMonth } from 'date-fns';

export type ListTransfersParams = {
  startDate?: Date;
  endDate?: Date;
};

export class ListTransfersUseCase implements UseCase<
  ListTransfersParams,
  ListTransfersQueryResult[]
> {
  constructor(private readonly listTransfersQuery: ListTransfersQuery) {}

  async execute(params: ListTransfersParams = {}): Promise<Result<ListTransfersQueryResult[]>> {
    const today = new Date();
    const period = ReportingPeriod.create({
      startDate: params.startDate ?? startOfMonth(today),
      endDate: params.endDate ?? endOfMonth(today),
    });
    if (period.isFailure) {
      return period.asFail();
    }

    const transfers = await this.listTransfersQuery.execute({ period: period.value });
    if (transfers.isFailure) {
      return transfers.asFail();
    }

    return Result.ok(transfers.value);
  }
}
