import { Result } from '@/shared/base';
import { Expense } from '@/transactions/core/model/Expense';
import { Income } from '@/transactions/core/model/Income';

export abstract class TransactionsRepository {
  abstract saveExpense(expense: Expense): Promise<Result<void>>;
  abstract saveIncome(income: Income): Promise<Result<void>>;
}
