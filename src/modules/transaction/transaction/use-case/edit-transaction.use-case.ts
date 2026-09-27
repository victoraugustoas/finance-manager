import { Result } from '@/shared/base/result';
import { UseCase } from '@/shared/base/UseCase';
import { CategoryType } from '@/shared/enums/category-type';
import { TransactionType } from '@/shared/enums/transaction-type';
import { Money } from '@/shared/ValueObjects/money.vo';
import { EditTransactionInDTO } from '../dto';
import { EditTransactionProps } from '../model';
import { AccountReferenceQuery, CategoryHierarchyQuery, TransactionRepository } from '../provider';

export class EditTransaction implements UseCase<EditTransactionInDTO, void> {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly accountReference: AccountReferenceQuery,
    private readonly categoryHierarchy: CategoryHierarchyQuery,
  ) {}

  async execute(input: EditTransactionInDTO): Promise<Result<void>> {
    const isIncome = input.type === TransactionType.INCOME;

    const transaction = isIncome
      ? await this.transactionRepository.findIncomeById(input.id)
      : await this.transactionRepository.findExpenseById(input.id);
    if (transaction.isFailure) {
      return transaction.withFail;
    }

    const [accountReference, categoryReference] = await Promise.all([
      this.accountReference.execute({ accountId: input.accountId }),
      this.categoryHierarchy.execute({
        categoryId: input.categoryId,
        subCategoryId: input.subCategoryId,
        type: isIncome ? CategoryType.INCOME : CategoryType.EXPENSE,
      }),
    ]);

    const amount = Money.tryCreate(input.amount);

    const references = Result.combine([accountReference, categoryReference, amount]);
    if (references.isFailure) {
      return references.withFail;
    }

    const changes: EditTransactionProps = {
      name: input.name,
      amount: amount.instance.amountInCents,
      categoryId: input.categoryId,
      subCategoryId: input.subCategoryId,
      notes: input.notes,
      dueDate: input.dueDate,
      entryDate: input.entryDate,
      effectivated: input.effectivated,
      effectivatedDate: input.effectivatedDate,
      accountId: input.accountId,
    };

    const edited = transaction.instance.edit(changes);
    if (edited.isFailure) {
      return edited.withFail;
    }

    return this.transactionRepository.update(edited.instance);
  }
}
