import { Result } from '@/shared/base';
import { ReportingPeriod } from '@/shared/ValueObjects';

export type ListExpenseQueryProps = {
  period: ReportingPeriod;
};

export type ListExpenseQueryResult = {
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

export abstract class ListExpenseQuery {
  abstract execute(props: ListExpenseQueryProps): Promise<Result<ListExpenseQueryResult[]>>;
}
