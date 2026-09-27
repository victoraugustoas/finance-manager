import { CategoryType } from '@/shared/enums/category-type';

/** Monetary values in reporting projections are always minor units (cents). */
export interface ReportingAccountOutDTO {
  id: string;
  name: string;
  openingBalanceInCents: number;
}

export type MovementType = 'INCOME' | 'EXPENSE' | 'TRANSFER_IN' | 'TRANSFER_OUT';

export interface MovementPartyOutDTO {
  id: string;
  name: string;
}

export interface MovementOutDTO {
  id: string;
  movementType: MovementType;
  name: string;
  amountInCents: number;
  dueDate: Date;
  entryDate: Date;
  effectivated: boolean;
  effectivatedDate?: Date | null;
  notes?: string | null;
  account?: MovementPartyOutDTO;
  originAccount?: MovementPartyOutDTO;
  destinationAccount?: MovementPartyOutDTO;
  category?: MovementPartyOutDTO;
  subCategory?: MovementPartyOutDTO;
}

export interface CategoryBreakdownRowOutDTO {
  name: string;
  totalInCents: number;
}

export interface BreakdownCategoriesOutDTO {
  categories: CategoryBreakdownRowOutDTO[];
}

export interface BreakdownCategoriesInDTO {
  categoriesId?: string[];
  startDate: Date;
  endDate: Date;
  effectivated: boolean;
  type: CategoryType;
}

export interface FindAccountsWithBalanceInDTO {
  endDate: Date;
}

export interface AccountWithBalanceOutDTO {
  account: ReportingAccountOutDTO;
  balanceInCents: number;
  estimatedBalanceInCents: number;
}

export interface FindStatementInDTO {
  startDate: Date;
  endDate: Date;
  accountId?: string;
}

export type StatementBalanceImpactDirection = 'IN' | 'OUT' | 'NEUTRAL';
export type StatementEntryMovementType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface StatementEntryOutDTO {
  id: string;
  movementType: StatementEntryMovementType;
  name: string;
  amountInCents: number;
  dueDate: Date;
  entryDate: Date;
  effectivated: boolean;
  effectivatedDate?: Date | null;
  notes?: string | null;
  account?: MovementPartyOutDTO;
  originAccount?: MovementPartyOutDTO;
  destinationAccount?: MovementPartyOutDTO;
  category?: MovementPartyOutDTO;
  subCategory?: MovementPartyOutDTO;
  balanceImpact: {
    direction: StatementBalanceImpactDirection;
    amountInCents: number;
  };
  includedInBalance: boolean;
}

export interface StatementDayOutDTO {
  date: Date;
  balanceInCents: number;
  entries: StatementEntryOutDTO[];
}

export interface StatementOutDTO {
  startDate: Date;
  endDate: Date;
  accountId?: string;
  initialBalanceInCents: number;
  finalBalanceInCents: number;
  days: StatementDayOutDTO[];
}
