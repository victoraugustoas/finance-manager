import { AccountsRepository } from '@/accounts/core/ports/repositories/Accounts.repository';
import { ListAccountsHandler } from '@/accounts/core/queries/ListAccounts/ListAccounts.handler';
import { Account } from '@/accounts/core/model/Account';
import { Errors } from '@/shared/base/Errors';
import { Result } from '@/shared/base/Result';
import { ListTransactionsReader } from '@/accounts/core/ports/readers/ListTransactionsReader';
import { AccountBalanceCalculatorService } from '@/accounts/core/service/AccountBalanceCalculator.service';
import { Money } from '@/shared/ValueObjects';
import { endOfDay } from 'date-fns';

jest.mock('@/accounts/core/service/AccountBalanceCalculator.service');

const makeAccount = (id: string, name: string): Account =>
  Account.new({
    id,
    name,
    openingBalance: 25,
  });

describe('ListAccountsHandler', () => {
  let calculateMock: jest.Mock;

  beforeEach(() => {
    calculateMock = jest.fn();
    jest.mocked(AccountBalanceCalculatorService).mockClear();
    jest.mocked(AccountBalanceCalculatorService).mockImplementation(
      () =>
        ({
          calculate: calculateMock,
        }) as unknown as AccountBalanceCalculatorService,
    );
  });

  it('should return all accounts with calculated and estimated balances until the required end date', async () => {
    const endDate = new Date('2026-06-16T10:30:00.000Z');
    const accounts = [makeAccount('account-1', 'Checking'), makeAccount('account-2', 'Savings')];
    const checkingEffectivatedTransactions = [
      { amountInCents: 10000, movementType: 'INCOME' as const, dueDate: new Date() },
      { amountInCents: 3000, movementType: 'EXPENSE' as const, dueDate: new Date() },
    ];
    const checkingAllTransactions = [
      ...checkingEffectivatedTransactions,
      { amountInCents: 2500, movementType: 'INCOME' as const, dueDate: new Date() },
    ];
    const savingsEffectivatedTransactions = [
      { amountInCents: 5000, movementType: 'TRANSFER_IN' as const, dueDate: new Date() },
      { amountInCents: 1500, movementType: 'TRANSFER_OUT' as const, dueDate: new Date() },
    ];
    const savingsAllTransactions = [
      ...savingsEffectivatedTransactions,
      { amountInCents: 1000, movementType: 'EXPENSE' as const, dueDate: new Date() },
    ];
    const accountsRepository = {
      findAll: jest.fn().mockResolvedValue(Result.ok(accounts)),
    } as unknown as AccountsRepository;
    const listTransactionsReader = {
      listTransactions: jest.fn(),
      listTransactionsToEndDate: jest
        .fn()
        .mockResolvedValueOnce(Result.ok(checkingEffectivatedTransactions))
        .mockResolvedValueOnce(Result.ok(checkingAllTransactions))
        .mockResolvedValueOnce(Result.ok(savingsEffectivatedTransactions))
        .mockResolvedValueOnce(Result.ok(savingsAllTransactions)),
    } as unknown as ListTransactionsReader;
    calculateMock
      .mockReturnValueOnce(Money.create(95).value)
      .mockReturnValueOnce(Money.create(120).value)
      .mockReturnValueOnce(Money.create(60).value)
      .mockReturnValueOnce(Money.create(50).value);

    const handler = new ListAccountsHandler(accountsRepository, listTransactionsReader);

    const result = await handler.handle({ endDate });
    const expectedEndDate = endOfDay(endDate);

    expect(result.isSuccess).toBe(true);
    expect(result.value[0].account).toBe(accounts[0]);
    expect(result.value[0].balance.amountInCents).toBe(9500);
    expect(result.value[0].estimatedBalance.amountInCents).toBe(12000);
    expect(result.value[1].account).toBe(accounts[1]);
    expect(result.value[1].balance.amountInCents).toBe(6000);
    expect(result.value[1].estimatedBalance.amountInCents).toBe(5000);
    expect(accountsRepository.findAll).toHaveBeenCalledTimes(1);
    expect(listTransactionsReader.listTransactions).not.toHaveBeenCalled();
    expect(listTransactionsReader.listTransactionsToEndDate).toHaveBeenCalledTimes(4);
    expect(listTransactionsReader.listTransactionsToEndDate).toHaveBeenNthCalledWith(1, {
      accountId: 'account-1',
      effectivated: true,
      endDate: expectedEndDate,
    });
    expect(listTransactionsReader.listTransactionsToEndDate).toHaveBeenNthCalledWith(2, {
      accountId: 'account-1',
      endDate: expectedEndDate,
    });
    expect(listTransactionsReader.listTransactionsToEndDate).toHaveBeenNthCalledWith(3, {
      accountId: 'account-2',
      effectivated: true,
      endDate: expectedEndDate,
    });
    expect(listTransactionsReader.listTransactionsToEndDate).toHaveBeenNthCalledWith(4, {
      accountId: 'account-2',
      endDate: expectedEndDate,
    });
    expect(calculateMock).toHaveBeenCalledTimes(4);
    expect(calculateMock).toHaveBeenNthCalledWith(1, accounts[0], checkingEffectivatedTransactions);
    expect(calculateMock).toHaveBeenNthCalledWith(2, accounts[0], checkingAllTransactions);
    expect(calculateMock).toHaveBeenNthCalledWith(3, accounts[1], savingsEffectivatedTransactions);
    expect(calculateMock).toHaveBeenNthCalledWith(4, accounts[1], savingsAllTransactions);
  });

  it('should calculate balances and estimated balances until the given end date', async () => {
    const endDate = new Date('2026-01-10T12:00:00.000Z');
    const accounts = [makeAccount('account-1', 'Checking'), makeAccount('account-2', 'Savings')];
    const checkingEffectivatedTransactions = [
      { amountInCents: 10000, movementType: 'INCOME' as const, dueDate: new Date() },
    ];
    const checkingAllTransactions = [
      ...checkingEffectivatedTransactions,
      { amountInCents: 2000, movementType: 'INCOME' as const, dueDate: new Date() },
    ];
    const savingsEffectivatedTransactions = [
      { amountInCents: 1500, movementType: 'TRANSFER_OUT' as const, dueDate: new Date() },
    ];
    const savingsAllTransactions = [
      ...savingsEffectivatedTransactions,
      { amountInCents: 500, movementType: 'EXPENSE' as const, dueDate: new Date() },
    ];
    const accountsRepository = {
      findAll: jest.fn().mockResolvedValue(Result.ok(accounts)),
    } as unknown as AccountsRepository;
    const listTransactionsReader = {
      listTransactions: jest.fn(),
      listTransactionsToEndDate: jest
        .fn()
        .mockResolvedValueOnce(Result.ok(checkingEffectivatedTransactions))
        .mockResolvedValueOnce(Result.ok(checkingAllTransactions))
        .mockResolvedValueOnce(Result.ok(savingsEffectivatedTransactions))
        .mockResolvedValueOnce(Result.ok(savingsAllTransactions)),
    } as unknown as ListTransactionsReader;
    calculateMock
      .mockReturnValueOnce(Money.create(125).value)
      .mockReturnValueOnce(Money.create(145).value)
      .mockReturnValueOnce(Money.create(10).value)
      .mockReturnValueOnce(Money.create(5).value);

    const handler = new ListAccountsHandler(accountsRepository, listTransactionsReader);

    const result = await handler.handle({ endDate });

    expect(result.isSuccess).toBe(true);
    expect(listTransactionsReader.listTransactions).not.toHaveBeenCalled();
    expect(listTransactionsReader.listTransactionsToEndDate).toHaveBeenCalledTimes(4);
    expect(listTransactionsReader.listTransactionsToEndDate).toHaveBeenNthCalledWith(1, {
      accountId: 'account-1',
      effectivated: true,
      endDate: endOfDay(endDate),
    });
    expect(listTransactionsReader.listTransactionsToEndDate).toHaveBeenNthCalledWith(2, {
      accountId: 'account-1',
      endDate: endOfDay(endDate),
    });
    expect(listTransactionsReader.listTransactionsToEndDate).toHaveBeenNthCalledWith(3, {
      accountId: 'account-2',
      effectivated: true,
      endDate: endOfDay(endDate),
    });
    expect(listTransactionsReader.listTransactionsToEndDate).toHaveBeenNthCalledWith(4, {
      accountId: 'account-2',
      endDate: endOfDay(endDate),
    });
    expect(result.value[0].balance.amountInCents).toBe(12500);
    expect(result.value[0].estimatedBalance.amountInCents).toBe(14500);
    expect(result.value[1].balance.amountInCents).toBe(1000);
    expect(result.value[1].estimatedBalance.amountInCents).toBe(500);
    expect(calculateMock).toHaveBeenNthCalledWith(1, accounts[0], checkingEffectivatedTransactions);
    expect(calculateMock).toHaveBeenNthCalledWith(2, accounts[0], checkingAllTransactions);
    expect(calculateMock).toHaveBeenNthCalledWith(3, accounts[1], savingsEffectivatedTransactions);
    expect(calculateMock).toHaveBeenNthCalledWith(4, accounts[1], savingsAllTransactions);
  });

  it('should propagate repository failures', async () => {
    const accountsRepository = {
      findAll: jest.fn().mockResolvedValue(
        Result.fail<Account[]>({
          code: Errors.PRISMA_QUERY_ERROR,
          cls: 'test',
        }),
      ),
    } as unknown as AccountsRepository;
    const listTransactionsReader = {
      listTransactions: jest.fn(),
      listTransactionsToEndDate: jest.fn(),
    } as unknown as ListTransactionsReader;

    const handler = new ListAccountsHandler(accountsRepository, listTransactionsReader);

    const result = await handler.handle({ endDate: new Date('2026-01-10T12:00:00.000Z') });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
    expect(accountsRepository.findAll).toHaveBeenCalledTimes(1);
    expect(listTransactionsReader.listTransactions).not.toHaveBeenCalled();
    expect(listTransactionsReader.listTransactionsToEndDate).not.toHaveBeenCalled();
  });

  it('should propagate transaction query failures', async () => {
    const accounts = [makeAccount('account-1', 'Checking')];
    const accountsRepository = {
      findAll: jest.fn().mockResolvedValue(Result.ok(accounts)),
    } as unknown as AccountsRepository;
    const listTransactionsReader = {
      listTransactions: jest.fn(),
      listTransactionsToEndDate: jest.fn().mockResolvedValue(
        Result.fail({
          code: Errors.PRISMA_QUERY_ERROR,
          cls: 'test',
        }),
      ),
    } as unknown as ListTransactionsReader;

    const handler = new ListAccountsHandler(accountsRepository, listTransactionsReader);

    const result = await handler.handle({ endDate: new Date('2026-01-10T12:00:00.000Z') });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
    expect(listTransactionsReader.listTransactions).not.toHaveBeenCalled();
    expect(listTransactionsReader.listTransactionsToEndDate).toHaveBeenCalledTimes(2);
  });
});
