export type ListExpenseResult = {
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
};
