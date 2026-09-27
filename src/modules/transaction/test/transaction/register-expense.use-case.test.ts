import { CategoryType } from '@/shared/enums/category-type';
import {
  AccountReferenceErrors,
  CategoryHierarchyErrors,
  RegisterExpense,
  Transaction,
} from '@/modules/transaction';
import { InMemoryTransactionRepository } from '../mock/in-memory-transaction.repository';
import {
  acceptingAccountReference,
  acceptingCategoryHierarchy,
  rejectingAccountReference,
  rejectingCategoryHierarchy,
} from '../mock/reference-query.mock';

const input = {
  name: 'Groceries',
  amount: 49.9,
  dueDate: new Date('2026-01-15T12:00:00.000Z'),
  entryDate: new Date('2026-01-10T12:00:00.000Z'),
  effectivated: false,
  accountId: '33333333-3333-3333-3333-333333333333',
  categoryId: '11111111-1111-1111-1111-111111111111',
  subCategoryId: '22222222-2222-2222-2222-222222222222',
};

describe('RegisterExpense', () => {
  test('should persist the expense converting the amount to cents', async () => {
    const repository = new InMemoryTransactionRepository();
    const useCase = new RegisterExpense(
      repository,
      acceptingAccountReference(),
      acceptingCategoryHierarchy(),
    );

    const result = await useCase.execute(input);

    expect(result.isOk).toBe(true);
    expect(result.instance.amount.amountInCents).toBe(4990);
    expect(repository.items.size).toBe(1);
  });

  test('should check the category hierarchy for the expense type', async () => {
    const categoryHierarchy = acceptingCategoryHierarchy();
    const useCase = new RegisterExpense(
      new InMemoryTransactionRepository(),
      acceptingAccountReference(),
      categoryHierarchy,
    );

    await useCase.execute(input);

    expect(categoryHierarchy.execute).toHaveBeenCalledWith({
      categoryId: input.categoryId,
      subCategoryId: input.subCategoryId,
      type: CategoryType.EXPENSE,
    });
  });

  test('should fail when the account does not exist', async () => {
    const repository = new InMemoryTransactionRepository();
    const useCase = new RegisterExpense(
      repository,
      rejectingAccountReference(AccountReferenceErrors.ACCOUNT_NOT_FOUND),
      acceptingCategoryHierarchy(),
    );

    const result = await useCase.execute(input);

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(AccountReferenceErrors.ACCOUNT_NOT_FOUND);
    expect(repository.items.size).toBe(0);
  });

  test('should fail when the subcategory does not belong to the category', async () => {
    const useCase = new RegisterExpense(
      new InMemoryTransactionRepository(),
      acceptingAccountReference(),
      rejectingCategoryHierarchy(CategoryHierarchyErrors.SUBCATEGORY_NOT_IN_CATEGORY),
    );

    const result = await useCase.execute(input);

    expect(result.errors).toContain(CategoryHierarchyErrors.SUBCATEGORY_NOT_IN_CATEGORY);
  });

  test('should fail on domain invariants without persisting', async () => {
    const repository = new InMemoryTransactionRepository();
    const useCase = new RegisterExpense(
      repository,
      acceptingAccountReference(),
      acceptingCategoryHierarchy(),
    );

    const result = await useCase.execute({ ...input, amount: 0 });

    expect(result.errors).toContain(Transaction.AMOUNT_NOT_POSITIVE);
    expect(repository.items.size).toBe(0);
  });
});
