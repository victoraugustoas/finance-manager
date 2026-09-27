import { Result } from '@/shared/base/result';
import { Expense, Income, Transaction } from '../model';

export interface TransactionRepository {
  create(entity: Transaction<Expense> | Transaction<Income>): Promise<Result<void>>;
  update(entity: Transaction<Expense> | Transaction<Income>): Promise<Result<void>>;
  /** Fails with `ENTITY_NOT_FOUND` when no transaction of any type has the given id. */
  findById(id: string): Promise<Result<Expense | Income>>;
  /** Fails with `ENTITY_NOT_FOUND` when there is no expense with the given id. */
  findExpenseById(id: string): Promise<Result<Expense>>;
  /** Fails with `ENTITY_NOT_FOUND` when there is no income with the given id. */
  findIncomeById(id: string): Promise<Result<Income>>;
  delete(id: string): Promise<Result<void>>;
}
