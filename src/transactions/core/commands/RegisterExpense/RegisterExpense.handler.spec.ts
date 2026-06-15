import { Errors } from '@/shared/base/Errors';
import { Result } from '@/shared/base/Result';
import { RegisterExpenseHandler } from '@/transactions/core/commands/RegisterExpense/RegisterExpense.handler';
import { TransactionAccountReader } from '@/transactions/core/ports/acl/TransactionAccount.reader';
import { TransactionCategoryHierarchyReader } from '@/transactions/core/ports/acl/TransactionCategoryHierarchy.reader';
import { TransactionsRepository } from '@/transactions/core/ports/repositories/Transactions.repository';

describe('RegisterExpenseHandler', () => {
  const entryDate = new Date('2026-01-10T12:00:00.000Z');
  const dueDate = new Date('2026-01-15T12:00:00.000Z');

  const baseParams = {
    name: 'Groceries',
    amount: 100,
    dueDate,
    entryDate,
    effectivated: false,
    accountId: 'acc-1',
    categoryId: 'cat-1',
    subCategoryId: 'sub-1',
  };

  const categoryHierarchyOk = {
    ensureIncomeHierarchy: jest.fn(),
    ensureExpenseHierarchy: jest.fn().mockResolvedValue(Result.ok(undefined)),
  } as unknown as TransactionCategoryHierarchyReader;

  it('should fail when domain validation fails without calling persistence', async () => {
    const transactionsRepository = {
      saveExpense: jest.fn(),
    } as unknown as TransactionsRepository;
    const accounts = {
      existsById: jest.fn().mockResolvedValue(Result.ok(undefined)),
    } as unknown as TransactionAccountReader;

    const useCase = new RegisterExpenseHandler(
      transactionsRepository,
      accounts,
      categoryHierarchyOk,
    );

    const result = await useCase.handle({ ...baseParams, amount: 0 });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE);
    expect(transactionsRepository.saveExpense).not.toHaveBeenCalled();
  });

  it('should fail when account does not exist without persisting', async () => {
    const transactionsRepository = {
      saveExpense: jest.fn(),
    } as unknown as TransactionsRepository;
    const accounts = {
      existsById: jest.fn().mockResolvedValue(
        Result.fail<void>({
          code: Errors.REFERENCE_ACCOUNT_NOT_FOUND,
          cls: 'test',
          data: { accountId: baseParams.accountId },
        }),
      ),
    } as unknown as TransactionAccountReader;

    const useCase = new RegisterExpenseHandler(
      transactionsRepository,
      accounts,
      categoryHierarchyOk,
    );

    const result = await useCase.handle(baseParams);

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.REFERENCE_ACCOUNT_NOT_FOUND);
    expect(transactionsRepository.saveExpense).not.toHaveBeenCalled();
  });

  it('should fail when category hierarchy validation fails without persisting', async () => {
    const transactionsRepository = {
      saveExpense: jest.fn(),
    } as unknown as TransactionsRepository;
    const accounts = {
      existsById: jest.fn().mockResolvedValue(Result.ok(undefined)),
    } as unknown as TransactionAccountReader;
    const categoryHierarchy = {
      ensureIncomeHierarchy: jest.fn(),
      ensureExpenseHierarchy: jest.fn().mockResolvedValue(
        Result.fail<void>({
          code: Errors.REFERENCE_SUBCATEGORY_NOT_IN_CATEGORY,
          cls: 'test',
          data: { categoryId: baseParams.categoryId, subCategoryId: baseParams.subCategoryId },
        }),
      ),
    } as unknown as TransactionCategoryHierarchyReader;

    const useCase = new RegisterExpenseHandler(transactionsRepository, accounts, categoryHierarchy);

    const result = await useCase.handle(baseParams);

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.REFERENCE_SUBCATEGORY_NOT_IN_CATEGORY);
    expect(transactionsRepository.saveExpense).not.toHaveBeenCalled();
  });

  it('should persist when domain validation passes', async () => {
    const transactionsRepository = {
      saveExpense: jest.fn().mockResolvedValue(Result.ok(undefined)),
    } as unknown as TransactionsRepository;
    const accounts = {
      existsById: jest.fn().mockResolvedValue(Result.ok(undefined)),
    } as unknown as TransactionAccountReader;

    const useCase = new RegisterExpenseHandler(
      transactionsRepository,
      accounts,
      categoryHierarchyOk,
    );

    const result = await useCase.handle(baseParams);

    expect(result.isSuccess).toBe(true);
    expect(result.value.id).toEqual(expect.any(String));
    expect(transactionsRepository.saveExpense).toHaveBeenCalledTimes(1);
  });
});
