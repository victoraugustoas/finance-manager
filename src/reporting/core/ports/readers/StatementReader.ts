import { Result } from '@/shared/base';
import { Money } from '@/shared/ValueObjects';
import { StatementEntryKind } from '@/reporting/core/queries/Statement/Statement.result';

export type StatementReaderInput = {
  accountId?: string;
  endDate: Date;
};

export type StatementReaderAccount = {
  id: string;
  name: string;
  openingBalance: Money;
};

export type StatementReaderMovement = {
  id: string;
  kind: StatementEntryKind;
  name: string;
  amount: Money;
  dueDate: Date;
  entryDate: Date;
  effectivated: boolean;
  effectivatedDate?: Date | null;
  notes?: string | null;
  account?: {
    id: string;
    name: string;
  };
  originAccount?: {
    id: string;
    name: string;
  };
  destinationAccount?: {
    id: string;
    name: string;
  };
  category?: {
    id: string;
    name: string;
  };
  subCategory?: {
    id: string;
    name: string;
  };
  balanceImpactAmount: Money;
};

export type StatementReaderResult = {
  accounts: StatementReaderAccount[];
  movements: StatementReaderMovement[];
};

export abstract class StatementReader {
  abstract read(input: StatementReaderInput): Promise<Result<StatementReaderResult>>;
}
