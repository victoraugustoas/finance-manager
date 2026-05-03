import { Result } from '@/shared/base';
import { Expense } from '@/transactions/core/model/Expense';

export abstract class TransactionsRepository {
  abstract saveExpense(expense: Expense): Promise<Result<void>>;
}
