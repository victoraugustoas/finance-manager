import { Result } from '@/shared/base/result';
import { UseCase } from '@/shared/base/UseCase';
import { CategoryType } from '@/shared/enums/category-type';
import { Money } from '@/shared/ValueObjects/money.vo';
import { RegisterTransactionInDTO } from '../dto';
import { Income } from '../model';
import { AccountReferenceQuery, CategoryHierarchyQuery, TransactionRepository } from '../provider';

export class RegisterIncome implements UseCase<RegisterTransactionInDTO, Income> {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly accountReference: AccountReferenceQuery,
    private readonly categoryHierarchy: CategoryHierarchyQuery,
  ) {}

  async execute(input: RegisterTransactionInDTO): Promise<Result<Income>> {
    const amount = Money.tryCreate(input.amount);

    const [accountReference, categoryReference] = await Promise.all([
      this.accountReference.execute({ accountId: input.accountId }),
      this.categoryHierarchy.execute({
        categoryId: input.categoryId,
        subCategoryId: input.subCategoryId,
        type: CategoryType.INCOME,
      }),
    ]);

    const references = Result.combine([accountReference, categoryReference, amount]);
    if (references.isFailure) {
      return references.withFail;
    }

    const income = Income.register({
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
    if (income.isFailure) {
      return income;
    }

    const persisted = await this.transactionRepository.create(income.instance);
    if (persisted.isFailure) {
      return persisted.withFail;
    }

    return Result.ok(income.instance);
  }
}
