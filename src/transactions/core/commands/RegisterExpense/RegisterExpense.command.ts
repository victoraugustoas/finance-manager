export type RegisterExpenseCommand = {
  name: string;
  amount: number;
  dueDate: Date;
  entryDate: Date;
  paymentDate?: Date;
  effectivated: boolean;
  accountId: string;
  categoryId: string;
  subCategoryId: string;
  notes?: string;
};
