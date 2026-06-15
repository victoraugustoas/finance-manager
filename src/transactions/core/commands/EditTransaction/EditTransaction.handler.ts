import { EditTransactionCommand } from './EditTransaction.command';
import { Result } from '@/shared/base';
import { Income } from '@/transactions/core/model/Income';
import { Expense } from '@/transactions/core/model/Expense';
import { TransactionType } from '@/shared/enums/TransactionType';
import { TransactionAccountReader } from '@/transactions/core/ports/acl/TransactionAccount.reader';
import { TransactionCategoryHierarchyReader } from '@/transactions/core/ports/acl/TransactionCategoryHierarchy.reader';
import { TransactionsRepository } from '@/transactions/core/ports/repositories/Transactions.repository';

export class EditTransactionHandler {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly accounts: TransactionAccountReader,
    private readonly categoryHierarchy: TransactionCategoryHierarchyReader,
  ) {}

  async handle(params: EditTransactionCommand): Promise<Result<void>> {
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

  private editIncome(income: Income, params: EditTransactionCommand) {
    const editResult = income.edit(params);
    if (editResult.isFailure) return editResult.asFail();
    return this.transactionsRepository.saveIncome(income);
  }

  private editExpense(expense: Expense, params: EditTransactionCommand) {
    const editResult = expense.edit(params);
    if (editResult.isFailure) return editResult.asFail();
    return this.transactionsRepository.saveExpense(expense);
  }
}
