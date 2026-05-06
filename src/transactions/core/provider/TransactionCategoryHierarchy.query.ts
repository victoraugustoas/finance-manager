import { Result } from '@/shared/base';

export abstract class TransactionCategoryHierarchyQuery {
  abstract ensureIncomeHierarchy(categoryId: string, subCategoryId: string): Promise<Result<void>>;

  abstract ensureExpenseHierarchy(categoryId: string, subCategoryId: string): Promise<Result<void>>;
}
