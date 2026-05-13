import { Errors } from '@/shared/base/Errors';
import { Result } from '@/shared/base/Result';
import { RegisterIncomeUseCase } from '@/transactions/core/usecases/RegisterIncome.usecase';
import { TransactionAccountQuery } from '../provider/TransactionAccount.query';
import { TransactionCategoryHierarchyQuery } from '../provider/TransactionCategoryHierarchy.query';
import { TransactionsRepository } from '../provider/Transactions.repository';

describe('RegisterIncomeUseCase', () => {
  const entryDate = new Date('2026-01-10T12:00:00.000Z');
  const dueDate = new Date('2026-01-15T12:00:00.000Z');

  const baseParams = {
    name: 'Salary',
    amount: 3500,
    dueDate,
    entryDate,
    effectivated: false,
    accountId: 'acc-1',
    categoryId: 'cat-1',
    subCategoryId: 'sub-1',
  };

  const categoryHierarchyOk = {
    ensureIncomeHierarchy: jest.fn().mockResolvedValue(Result.ok(undefined)),
    ensureExpenseHierarchy: jest.fn(),
  } as unknown as TransactionCategoryHierarchyQuery;

  it('should fail when domain validation fails without calling persistence', async () => {
    const transactionsRepository = {
      saveExpense: jest.fn(),
      saveIncome: jest.fn(),
    } as unknown as TransactionsRepository;
    const accounts = {
      existsById: jest.fn().mockResolvedValue(Result.ok(undefined)),
    } as unknown as TransactionAccountQuery;

    const useCase = new RegisterIncomeUseCase(
      transactionsRepository,
      accounts,
      categoryHierarchyOk,
    );

    const result = await useCase.execute({ ...baseParams, amount: 0 });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE);
    expect(transactionsRepository.saveIncome).not.toHaveBeenCalled();
  });

  it('should fail when account does not exist without persisting', async () => {
    const transactionsRepository = {
      saveExpense: jest.fn(),
      saveIncome: jest.fn(),
    } as unknown as TransactionsRepository;
    const accounts = {
      existsById: jest.fn().mockResolvedValue(
        Result.fail<void>({
          code: Errors.REFERENCE_ACCOUNT_NOT_FOUND,
          cls: 'test',
          data: { accountId: baseParams.accountId },
        }),
      ),
    } as unknown as TransactionAccountQuery;

    const useCase = new RegisterIncomeUseCase(
      transactionsRepository,
      accounts,
      categoryHierarchyOk,
    );

    const result = await useCase.execute(baseParams);

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.REFERENCE_ACCOUNT_NOT_FOUND);
    expect(transactionsRepository.saveIncome).not.toHaveBeenCalled();
  });

  it('should fail when category hierarchy validation fails without persisting', async () => {
    const transactionsRepository = {
      saveExpense: jest.fn(),
      saveIncome: jest.fn(),
    } as unknown as TransactionsRepository;
    const accounts = {
      existsById: jest.fn().mockResolvedValue(Result.ok(undefined)),
    } as unknown as TransactionAccountQuery;
    const categoryHierarchy = {
      ensureIncomeHierarchy: jest.fn().mockResolvedValue(
        Result.fail<void>({
          code: Errors.REFERENCE_CATEGORY_NOT_FOUND,
          cls: 'test',
          data: { categoryId: baseParams.categoryId },
        }),
      ),
      ensureExpenseHierarchy: jest.fn(),
    } as unknown as TransactionCategoryHierarchyQuery;

    const useCase = new RegisterIncomeUseCase(transactionsRepository, accounts, categoryHierarchy);

    const result = await useCase.execute(baseParams);

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.REFERENCE_CATEGORY_NOT_FOUND);
    expect(transactionsRepository.saveIncome).not.toHaveBeenCalled();
  });

  it('should persist when domain validation passes', async () => {
    const transactionsRepository = {
      saveExpense: jest.fn(),
      saveIncome: jest.fn().mockResolvedValue(Result.ok(undefined)),
    } as unknown as TransactionsRepository;
    const accounts = {
      existsById: jest.fn().mockResolvedValue(Result.ok(undefined)),
    } as unknown as TransactionAccountQuery;

    const useCase = new RegisterIncomeUseCase(
      transactionsRepository,
      accounts,
      categoryHierarchyOk,
    );

    const result = await useCase.execute(baseParams);

    expect(result.isSuccess).toBe(true);
    expect(result.value.id).toEqual(expect.any(String));
    expect(transactionsRepository.saveIncome).toHaveBeenCalledTimes(1);
  });

  it('should return the persistence failure when saveIncome fails', async () => {
    const transactionsRepository = {
      saveExpense: jest.fn(),
      saveIncome: jest
        .fn()
        .mockResolvedValue(Result.fail({ code: Errors.PRISMA_INSERT_ERROR, cls: 'test' })),
    } as unknown as TransactionsRepository;
    const accounts = {
      existsById: jest.fn().mockResolvedValue(Result.ok(undefined)),
    } as unknown as TransactionAccountQuery;

    const useCase = new RegisterIncomeUseCase(
      transactionsRepository,
      accounts,
      categoryHierarchyOk,
    );

    const result = await useCase.execute(baseParams);

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_INSERT_ERROR);
  });

  it('should call existsById and ensureIncomeHierarchy with the params account and category ids', async () => {
    const transactionsRepository = {
      saveExpense: jest.fn(),
      saveIncome: jest.fn().mockResolvedValue(Result.ok(undefined)),
    } as unknown as TransactionsRepository;
    const accounts = {
      existsById: jest.fn().mockResolvedValue(Result.ok(undefined)),
    } as unknown as TransactionAccountQuery;
    const categoryHierarchy = {
      ensureIncomeHierarchy: jest.fn().mockResolvedValue(Result.ok(undefined)),
      ensureExpenseHierarchy: jest.fn(),
    } as unknown as TransactionCategoryHierarchyQuery;

    const useCase = new RegisterIncomeUseCase(transactionsRepository, accounts, categoryHierarchy);

    await useCase.execute(baseParams);

    expect(accounts.existsById).toHaveBeenCalledWith('acc-1');
    expect(categoryHierarchy.ensureIncomeHierarchy).toHaveBeenCalledWith('cat-1', 'sub-1');
  });
});
