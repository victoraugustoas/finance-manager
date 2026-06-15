import { Result } from '@/shared/base';
import { ReportingPeriod } from '@/shared/ValueObjects';
import { ListTransfersResult } from '@/transactions/core/queries/ListTransfers/ListTransfers.result';

export type ListTransfersReaderInput = {
  period: ReportingPeriod;
};

export abstract class ListTransfersReader {
  abstract read(input: ListTransfersReaderInput): Promise<Result<ListTransfersResult[]>>;
}
