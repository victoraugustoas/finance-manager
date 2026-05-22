import { Result } from '@/shared/base';
import { ReportingPeriod } from '@/shared/ValueObjects';

export type ListTransfersQueryProps = {
  period: ReportingPeriod;
};

export type ListTransfersQueryResult = {
  id: string;
  name: string;
  amount: number;
  notes?: string;
  dueDate: Date;
  entryDate: Date;
  effectivatedDate?: Date;
  effectivated: boolean;
  accountIdOrigin: string;
  accountOriginName: string;
  accountIdDestination: string;
  accountDestinationName: string;
};

export abstract class ListTransfersQuery {
  abstract execute(props: ListTransfersQueryProps): Promise<Result<ListTransfersQueryResult[]>>;
}
