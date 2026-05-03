import { Result, UseCase } from '@/shared/base';
import { Expense } from '@/transactions/core/model/Expense';
import { TransactionAccountQuery } from '../provider/TransactionAccount.query';
import { TransactionsRepository } from '@/transactions/core/provider/Transactions.repository';

export type RegisterExpenseParams = {
  name: string;
  amount: number;
  dueDate: Date;
  entryDate: Date;
  paymentDate?: Date;
  settled: boolean;
  accountId: string;
  categoryId: string;
  subCategoryId: string;
  notes?: string;
};

export class RegisterExpenseUseCase implements UseCase<RegisterExpenseParams, void> {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly accounts: TransactionAccountQuery,
  ) {}

  async execute(params: RegisterExpenseParams): Promise<Result<void>> {
    const accountRef = await this.accounts.existsById(params.accountId);
    if (accountRef.isFailure) {
      return accountRef.asFail();
    }

    const expense = Expense.create({
      name: params.name,
      amount: params.amount,
      categoryId: params.categoryId,
      subCategoryId: params.subCategoryId,
      notes: params.notes,
      dueDate: params.dueDate,
      entryDate: params.entryDate,
      effectivated: params.settled,
      effectivatedDate: params.settled ? params.paymentDate : undefined,
      accountId: params.accountId,
    });

    if (expense.isFailure) {
      return expense.asFail();
    }

    const persisted = await this.transactionsRepository.saveExpense(expense.value);
    if (persisted.isFailure) {
      return persisted.asFail();
    }

    return Result.ok(undefined);
  }
}
