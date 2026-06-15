import { RegisterIncomeCommand } from './RegisterIncome.command';
import { CommandHandler, Result } from '@/shared/base';
import { Income } from '@/transactions/core/model/Income';
import { TransactionAccountReader } from '@/transactions/core/ports/acl/TransactionAccount.reader';
import { TransactionCategoryHierarchyReader } from '@/transactions/core/ports/acl/TransactionCategoryHierarchy.reader';
import { TransactionsRepository } from '@/transactions/core/ports/repositories/Transactions.repository';

export class RegisterIncomeHandler implements CommandHandler<RegisterIncomeCommand, Income> {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly accounts: TransactionAccountReader,
    private readonly categoryHierarchy: TransactionCategoryHierarchyReader,
  ) {}

  async handle(params: RegisterIncomeCommand): Promise<Result<Income>> {
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
