export type RegisterIncomeCommand = {
  name: string;
  amount: number;
  dueDate: Date;
  entryDate: Date;
  receiptDate?: Date;
  effectivated: boolean;
  accountId: string;
  categoryId: string;
  subCategoryId: string;
  notes?: string;
};
