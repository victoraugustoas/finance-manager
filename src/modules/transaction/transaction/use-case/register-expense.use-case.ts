import { Result } from '@/shared/base/result';
import { UseCase } from '@/shared/base/UseCase';
import { CategoryType } from '@/shared/enums/category-type';
import { Money } from '@/shared/ValueObjects/money.vo';
import { RegisterTransactionInDTO } from '../dto';
import { Expense } from '../model';
import { AccountReferenceQuery, CategoryHierarchyQuery, TransactionRepository } from '../provider';

export class RegisterExpense implements UseCase<RegisterTransactionInDTO, Expense> {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly accountReference: AccountReferenceQuery,
    private readonly categoryHierarchy: CategoryHierarchyQuery,
  ) {}

  async execute(input: RegisterTransactionInDTO): Promise<Result<Expense>> {
    const amount = Money.tryCreate(input.amount);

    const [accountReference, categoryReference] = await Promise.all([
      this.accountReference.execute({ accountId: input.accountId }),
      this.categoryHierarchy.execute({
        categoryId: input.categoryId,
        subCategoryId: input.subCategoryId,
        type: CategoryType.EXPENSE,
      }),
    ]);

    const references = Result.combine([accountReference, categoryReference, amount]);
    if (references.isFailure) {
      return references.withFail;
    }

    const expense = Expense.register({
      name: input.name,
      amount: amount.instance.amountInCents,
      categoryId: input.categoryId,
      subCategoryId: input.subCategoryId,
      notes: input.notes,
      dueDate: input.dueDate,
      entryDate: input.entryDate,
      effectivated: input.effectivated,
      effectivatedDate: input.effectivated ? input.effectivatedDate : undefined,
      accountId: input.accountId,
    });
    if (expense.isFailure) {
      return expense;
    }

    const persisted = await this.transactionRepository.create(expense.instance);
    if (persisted.isFailure) {
      return persisted.withFail;
    }

    return Result.ok(expense.instance);
  }
}
