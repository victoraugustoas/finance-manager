import { TransactionType } from '@/shared/enums/transaction-type';

/** Write input of register/edit operations. Amounts are decimal values. */
export interface RegisterTransactionInDTO {
  name: string;
  amount: number;
  dueDate: Date;
  entryDate: Date;
  effectivated: boolean;
  effectivatedDate?: Date;
  accountId: string;
  categoryId: string;
  subCategoryId: string;
  notes?: string;
}

export interface EditTransactionInDTO extends RegisterTransactionInDTO {
  id: string;
  type: TransactionType;
}

export interface RegisterTransferInDTO {
  name: string;
  amount: number;
  dueDate: Date;
  entryDate: Date;
  effectivated: boolean;
  effectivatedDate?: Date;
  accountIdOrigin: string;
  accountIdDestination: string;
  notes?: string;
}

/** Period filter shared by the transaction listings. */
export interface ListTransactionsQueryInDTO {
  startDate?: Date;
  endDate?: Date;
}

/** Projection of an expense row. Amounts are decimal values. */
export interface ExpenseListItemOutDTO {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  subCategoryId: string;
  subCategoryName: string;
  notes?: string;
  dueDate: Date;
  entryDate: Date;
  paymentDate?: Date;
  effectivated: boolean;
  accountId: string;
  accountName: string;
}

/** Projection of an income row. Amounts are decimal values. */
export interface IncomeListItemOutDTO {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  subCategoryId: string;
  subCategoryName: string;
  notes?: string;
  dueDate: Date;
  entryDate: Date;
  receiptDate?: Date;
  effectivated: boolean;
  accountId: string;
  accountName: string;
}

/** Projection of a transfer row. Amounts are decimal values. */
export interface TransferListItemOutDTO {
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
}
