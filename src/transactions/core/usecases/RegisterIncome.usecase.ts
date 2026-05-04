import { Result, UseCase } from '@/shared/base';
import { Income } from '@/transactions/core/model/Income';
import { TransactionAccountQuery } from '../provider/TransactionAccount.query';
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

export class RegisterIncomeUseCase implements UseCase<RegisterIncomeParams, void> {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly accounts: TransactionAccountQuery,
  ) {}

  async execute(params: RegisterIncomeParams): Promise<Result<void>> {
    const accountRef = await this.accounts.existsById(params.accountId);
    const income = Income.create({
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

    const combineResults = Result.combine([accountRef, income]);
    if (combineResults.isFailure) {
      return combineResults.asFail();
    }

    const persisted = await this.transactionsRepository.saveIncome(income.value);
    if (persisted.isFailure) {
      return persisted.asFail();
    }

    return Result.ok(undefined);
  }
}
