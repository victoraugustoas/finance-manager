import { Result } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';
import { Account } from '@/accounts/core/model/Account';
import { AccountsRepository } from '@/accounts/core/provider/accounts.repository';
import {
  ListTransactionsQuery,
  ListTransactionsQueryResult,
} from '@/accounts/core/provider/ListTransactions.query';
import { endOfMonth, startOfMonth } from 'date-fns';
import { EstimatedBalanceUseCase } from './EstimatedBalance.usecase';

describe('EstimatedBalanceUseCase', () => {
  const makeAccount = () => Account.new({ name: 'Test', balance: 100, openingBalance: 50 });

  const makeRepo = (account = makeAccount()) =>
    ({
      findById: jest.fn().mockResolvedValue(Result.ok(account)),
      save: jest.fn(),
      findAll: jest.fn(),
    }) as unknown as AccountsRepository;

  const makeQuery = (transactions: ListTransactionsQueryResult[] = []) =>
    ({
      execute: jest.fn().mockResolvedValue(Result.ok(transactions)),
    }) as unknown as ListTransactionsQuery;

  const baseParams = { accountId: 'account-1' };

  it('should return actualBalance when no transactions exist in period', async () => {
    const useCase = new EstimatedBalanceUseCase(makeRepo(), makeQuery());

    const result = await useCase.execute(baseParams);

    expect(result.isSuccess).toBe(true);
    expect(result.value.estimatedBalance.amount).toBe(150); // balance(100) + openingBalance(50)
  });

  it('should add non-effectivated incomes to the balance', async () => {
    const query = makeQuery([{ amountInCents: 5000, movementType: 'INCOME', dueDate: new Date() }]);
    const useCase = new EstimatedBalanceUseCase(makeRepo(), query);

    const result = await useCase.execute(baseParams);

    expect(result.isSuccess).toBe(true);
    expect(result.value.estimatedBalance.amount).toBe(200); // 150 + 50
  });

  it('should subtract non-effectivated expenses from the balance', async () => {
    const query = makeQuery([
      { amountInCents: 3000, movementType: 'EXPENSE', dueDate: new Date() },
    ]);
    const useCase = new EstimatedBalanceUseCase(makeRepo(), query);

    const result = await useCase.execute(baseParams);

    expect(result.isSuccess).toBe(true);
    expect(result.value.estimatedBalance.amount).toBe(120); // 150 - 30
  });

  it('should default to today → endOfMonth when no dates are provided', async () => {
    const query = makeQuery();
    const useCase = new EstimatedBalanceUseCase(makeRepo(), query);

    await useCase.execute(baseParams);

    const callArg = (query.execute as jest.Mock).mock.calls[0][0];
    const today = new Date();
    expect(callArg.period.startDate.toDateString()).toBe(today.toDateString());
    expect(callArg.period.endDate.toDateString()).toBe(endOfMonth(today).toDateString());
  });

  it('should use provided startDate and endDate when given', async () => {
    const query = makeQuery();
    const useCase = new EstimatedBalanceUseCase(makeRepo(), query);
    const startDate = startOfMonth(new Date());
    const endDate = endOfMonth(new Date());

    await useCase.execute({ ...baseParams, startDate, endDate });

    const callArg = (query.execute as jest.Mock).mock.calls[0][0];
    expect(callArg.period.startDate.toDateString()).toBe(startDate.toDateString());
    expect(callArg.period.endDate.toDateString()).toBe(endDate.toDateString());
  });

  it('should fail when endDate is before startDate', async () => {
    const useCase = new EstimatedBalanceUseCase(makeRepo(), makeQuery());
    const startDate = new Date('2026-02-01');
    const endDate = new Date('2026-01-01');

    const result = await useCase.execute({ ...baseParams, startDate, endDate });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.END_DATE_NOT_AFTER_START_DATE);
  });

  it('should propagate account not found failure', async () => {
    const repo = {
      findById: jest
        .fn()
        .mockResolvedValue(Result.fail({ code: Errors.PRISMA_QUERY_ERROR, cls: 'test' })),
      save: jest.fn(),
      findAll: jest.fn(),
    } as unknown as AccountsRepository;
    const useCase = new EstimatedBalanceUseCase(repo, makeQuery());

    const result = await useCase.execute(baseParams);

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
  });

  it('should propagate query failure without calling domain service', async () => {
    const query = {
      execute: jest
        .fn()
        .mockResolvedValue(Result.fail({ code: Errors.PRISMA_QUERY_ERROR, cls: 'test' })),
    } as unknown as ListTransactionsQuery;
    const useCase = new EstimatedBalanceUseCase(makeRepo(), query);

    const result = await useCase.execute(baseParams);

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
  });
});
