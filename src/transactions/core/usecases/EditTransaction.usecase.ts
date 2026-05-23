import { Result, UseCase } from '@/shared/base';
import { Income } from '@/transactions/core/model/Income';
import { Expense } from '@/transactions/core/model/Expense';
import { TransactionProps } from '@/transactions/core/model/Transaction';
import { TransactionType } from '@/shared/enums/TransactionType';
import { TransactionAccountQuery } from '../provider/TransactionAccount.query';
import { TransactionCategoryHierarchyQuery } from '../provider/TransactionCategoryHierarchy.query';
import { TransactionsRepository } from '@/transactions/core/provider/Transactions.repository';

export type EditTransactionParams = TransactionProps & Required<Pick<TransactionProps, 'id'>>;

export class EditTransactionUseCase implements UseCase<EditTransactionParams, void> {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly accounts: TransactionAccountQuery,
    private readonly categoryHierarchy: TransactionCategoryHierarchyQuery,
  ) {}

  async execute(params: EditTransactionParams): Promise<Result<void>> {
    const transactionResult =
      params.type === TransactionType.INCOME
        ? await this.transactionsRepository.findIncomeById(params.id)
        : await this.transactionsRepository.findExpenseById(params.id);

    if (transactionResult.isFailure) return transactionResult.asFail();

    const [accountRef, categoryRef] = await Promise.all([
      this.accounts.existsById(params.accountId),
      params.type === TransactionType.INCOME
        ? this.categoryHierarchy.ensureIncomeHierarchy(params.categoryId, params.subCategoryId)
        : this.categoryHierarchy.ensureExpenseHierarchy(params.categoryId, params.subCategoryId),
    ]);

    const refCheck = Result.combine([accountRef, categoryRef]);
    if (refCheck.isFailure) return refCheck.asFail();

    if (params.type === TransactionType.INCOME) {
      return this.editIncome(transactionResult.value, params);
    } else {
      return this.editExpense(transactionResult.value, params);
    }
  }

  private editIncome(income: Income, params: EditTransactionParams) {
    const editResult = income.edit(params);
    if (editResult.isFailure) return editResult.asFail();
    return this.transactionsRepository.saveIncome(income);
  }

  private editExpense(expense: Expense, params: EditTransactionParams) {
    const editResult = expense.edit(params);
    if (editResult.isFailure) return editResult.asFail();
    return this.transactionsRepository.saveExpense(expense);
  }
}
