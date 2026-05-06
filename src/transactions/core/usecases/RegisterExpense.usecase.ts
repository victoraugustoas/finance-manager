import { Result, UseCase } from '@/shared/base';
import { Expense } from '@/transactions/core/model/Expense';
import { TransactionAccountQuery } from '../provider/TransactionAccount.query';
import { TransactionCategoryHierarchyQuery } from '../provider/TransactionCategoryHierarchy.query';
import { TransactionsRepository } from '@/transactions/core/provider/Transactions.repository';

export type RegisterExpenseParams = {
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

export class RegisterExpenseUseCase implements UseCase<RegisterExpenseParams, void> {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly accounts: TransactionAccountQuery,
    private readonly categoryHierarchy: TransactionCategoryHierarchyQuery,
  ) {}

  async execute(params: RegisterExpenseParams): Promise<Result<void>> {
    const [accountRef, categoryRef] = await Promise.all([
      this.accounts.existsById(params.accountId),
      this.categoryHierarchy.ensureExpenseHierarchy(params.categoryId, params.subCategoryId),
    ]);
    const expense = Expense.create({
      name: params.name,
      amount: params.amount,
      categoryId: params.categoryId,
      subCategoryId: params.subCategoryId,
      notes: params.notes,
      dueDate: params.dueDate,
      entryDate: params.entryDate,
      effectivated: params.effectivated,
      effectivatedDate: params.effectivated ? params.paymentDate : undefined,
      accountId: params.accountId,
    });

    const combineResults = Result.combine([accountRef, categoryRef, expense]);
    if (combineResults.isFailure) {
      return combineResults.asFail();
    }

    const persisted = await this.transactionsRepository.saveExpense(expense.value);
    if (persisted.isFailure) {
      return persisted.asFail();
    }

    return Result.ok(undefined);
  }
}
