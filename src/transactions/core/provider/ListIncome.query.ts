import { Result } from '@/shared/base';
import { ReportingPeriod } from '@/shared/ValueObjects';

export type ListIncomeQueryProps = {
  period: ReportingPeriod;
};

export type ListIncomeQueryResult = {
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

export abstract class ListIncomeQuery {
  abstract execute(props: ListIncomeQueryProps): Promise<Result<ListIncomeQueryResult[]>>;
}
