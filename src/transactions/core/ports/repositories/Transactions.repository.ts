import { Result } from '@/shared/base';
import { Expense } from '@/transactions/core/model/Expense';
import { Income } from '@/transactions/core/model/Income';
import { Transfer } from '@/transactions/core/model/Transfer';

export abstract class TransactionsRepository {
  abstract saveExpense(expense: Expense): Promise<Result<void>>;
  abstract saveIncome(income: Income): Promise<Result<void>>;
  abstract findIncomeById(id: string): Promise<Result<Income>>;
  abstract findExpenseById(id: string): Promise<Result<Expense>>;
  abstract saveTransfer(transfer: Transfer): Promise<Result<void>>;
}
