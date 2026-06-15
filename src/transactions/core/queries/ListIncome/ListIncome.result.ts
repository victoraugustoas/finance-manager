export type ListIncomeResult = {
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
};
