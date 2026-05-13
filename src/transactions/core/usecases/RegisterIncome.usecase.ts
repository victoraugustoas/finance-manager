import { Result, UseCase } from '@/shared/base';
import { Income } from '@/transactions/core/model/Income';
import { TransactionAccountQuery } from '../provider/TransactionAccount.query';
import { TransactionCategoryHierarchyQuery } from '../provider/TransactionCategoryHierarchy.query';
import { TransactionsRepository } from '@/transactions/core/provider/Transactions.repository';

export type RegisterIncomeParams = {
  name: string;
  amount: number;
  dueDate: Date;
  entryDate: Date;
  receiptDate?: Date;
  effectivated: boolean;
  accountId: string;
  categoryId: string;
  subCategoryId: string;
  notes?: string;
};

export class RegisterIncomeUseCase implements UseCase<RegisterIncomeParams, Income> {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly accounts: TransactionAccountQuery,
    private readonly categoryHierarchy: TransactionCategoryHierarchyQuery,
  ) {}

  async execute(params: RegisterIncomeParams): Promise<Result<Income>> {
    const [accountRef, categoryRef] = await Promise.all([
      this.accounts.existsById(params.accountId),
      this.categoryHierarchy.ensureIncomeHierarchy(params.categoryId, params.subCategoryId),
    ]);
    const income = Income.register({
      name: params.name,
      amount: params.amount,
      categoryId: params.categoryId,
      subCategoryId: params.subCategoryId,
      notes: params.notes,
      dueDate: params.dueDate,
      entryDate: params.entryDate,
      effectivated: params.effectivated,
      effectivatedDate: params.effectivated ? params.receiptDate : undefined,
      accountId: params.accountId,
    });

    const combineResults = Result.combine([accountRef, categoryRef, income]);
    if (combineResults.isFailure) {
      return combineResults.asFail();
    }

    const persisted = await this.transactionsRepository.saveIncome(income.value);
    if (persisted.isFailure) {
      return persisted.asFail();
    }

    return Result.ok(income.value);
  }
}
