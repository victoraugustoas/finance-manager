import { Result } from '@/shared/base/result';
import { RepositoryErrors } from '@/shared/errors/shared-errors';
import { TransactionType } from '@/shared/enums/transaction-type';
import { Expense, Income, Transaction, TransactionRepository } from '@/modules/transaction';

export class InMemoryTransactionRepository implements TransactionRepository {
  readonly items = new Map<string, Expense | Income>();

  async create(entity: Transaction<Expense> | Transaction<Income>): Promise<Result<void>> {
    this.items.set(entity.id, entity as Expense | Income);
    return Result.ok();
  }

  async update(entity: Transaction<Expense> | Transaction<Income>): Promise<Result<void>> {
    this.items.set(entity.id, entity as Expense | Income);
    return Result.ok();
  }

  async findById(id: string): Promise<Result<Expense | Income>> {
    const entity = this.items.get(id);
    if (!entity) {
      return Result.fail(RepositoryErrors.ENTITY_NOT_FOUND);
    }

    return Result.ok(entity);
  }

  async findExpenseById(id: string): Promise<Result<Expense>> {
    const entity = this.items.get(id);
    if (!entity || entity.type !== TransactionType.EXPENSE) {
      return Result.fail(RepositoryErrors.ENTITY_NOT_FOUND);
    }

    return Result.ok(entity as Expense);
  }

  async findIncomeById(id: string): Promise<Result<Income>> {
    const entity = this.items.get(id);
    if (!entity || entity.type !== TransactionType.INCOME) {
      return Result.fail(RepositoryErrors.ENTITY_NOT_FOUND);
    }

    return Result.ok(entity as Income);
  }

  async delete(id: string): Promise<Result<void>> {
    this.items.delete(id);
    return Result.ok();
  }
}
