import { Money } from '@/shared/ValueObjects';

export type StatementBalanceImpactDirection = 'IN' | 'OUT' | 'NEUTRAL';
export type StatementEntryMovementType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export type StatementEntryResult = {
  id: string;
  movementType: StatementEntryMovementType;
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
  balanceImpact: {
    direction: StatementBalanceImpactDirection;
    amount: Money;
  };
  includedInBalance: boolean;
};

export type StatementDayResult = {
  date: Date;
  balance: Money;
  entries: StatementEntryResult[];
};

export type StatementResult = {
  startDate: Date;
  endDate: Date;
  accountId?: string;
  initialBalance: Money;
  finalBalance: Money;
  days: StatementDayResult[];
};
