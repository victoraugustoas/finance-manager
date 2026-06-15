import { EffectivatedProps } from '@/shared/ValueObjects/Effectivated';

export interface RegisterExpenseCommand extends EffectivatedProps {
  name: string;
  amount: number;
  dueDate: Date;
  entryDate: Date;
  accountId: string;
  categoryId: string;
  subCategoryId: string;
  notes?: string;
}
