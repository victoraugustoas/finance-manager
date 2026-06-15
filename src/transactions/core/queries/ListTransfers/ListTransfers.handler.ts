import { ListTransfersReader } from '@/transactions/core/ports/readers/ListTransfersReader';
import { ListTransfersQuery } from './ListTransfers.query';
import { ListTransfersResult } from './ListTransfers.result';
import { QueryHandler, Result } from '@/shared/base';
import { ReportingPeriod } from '@/shared/ValueObjects';
import { endOfMonth, startOfMonth } from 'date-fns';

export class ListTransfersHandler implements QueryHandler<
  ListTransfersQuery | undefined,
  ListTransfersResult[]
> {
  constructor(private readonly reader: ListTransfersReader) {}

  async handle(query: ListTransfersQuery = {}): Promise<Result<ListTransfersResult[]>> {
    const today = new Date();
    const period = ReportingPeriod.create({
      startDate: query.startDate ?? startOfMonth(today),
      endDate: query.endDate ?? endOfMonth(today),
    });
    if (period.isFailure) {
      return period.asFail();
    }

    const transfers = await this.reader.read({ period: period.value });
    if (transfers.isFailure) {
      return transfers.asFail();
    }

    return Result.ok(transfers.value);
  }
}
