import { Errors } from '@/shared/base/Errors';
import { Result } from '@/shared/base/Result';
import { RegisterExpenseUseCase } from '@/transactions/core/usecases/RegisterExpense.usecase';
import { TransactionAccountQuery } from '../provider/TransactionAccount.query';
import { TransactionsRepository } from '@/transactions/core/provider/Transactions.repository';

describe('RegisterExpenseUseCase', () => {
  const entryDate = new Date('2026-01-10T12:00:00.000Z');
  const dueDate = new Date('2026-01-15T12:00:00.000Z');

  const baseParams = {
    name: 'Groceries',
    amount: 100,
    dueDate,
    entryDate,
    settled: false,
    accountId: 'acc-1',
    categoryId: 'cat-1',
    subCategoryId: 'sub-1',
  };

  it('should fail when domain validation fails without calling persistence', async () => {
    const transactionsRepository = {
      saveExpense: jest.fn(),
    } as unknown as TransactionsRepository;
    const accounts = {
      existsById: jest.fn().mockResolvedValue(Result.ok(undefined)),
    } as unknown as TransactionAccountQuery;

    const useCase = new RegisterExpenseUseCase(transactionsRepository, accounts);

    const result = await useCase.execute({ ...baseParams, amount: 0 });

    expect(result.isFailure).toBe(true);
    expect(result.error.code).toBe(Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE);
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
    } as unknown as TransactionAccountQuery;

    const useCase = new RegisterExpenseUseCase(transactionsRepository, accounts);

    const result = await useCase.execute(baseParams);

    expect(result.isFailure).toBe(true);
    expect(result.error.code).toBe(Errors.REFERENCE_ACCOUNT_NOT_FOUND);
    expect(transactionsRepository.saveExpense).not.toHaveBeenCalled();
  });

  it('should persist when domain validation passes', async () => {
    const transactionsRepository = {
      saveExpense: jest.fn().mockResolvedValue(Result.ok(undefined)),
    } as unknown as TransactionsRepository;
    const accounts = {
      existsById: jest.fn().mockResolvedValue(Result.ok(undefined)),
    } as unknown as TransactionAccountQuery;

    const useCase = new RegisterExpenseUseCase(transactionsRepository, accounts);

    const result = await useCase.execute(baseParams);

    expect(result.isSuccess).toBe(true);
    expect(transactionsRepository.saveExpense).toHaveBeenCalledTimes(1);
  });
});
