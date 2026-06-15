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

  it('should return all accounts with calculated balances', async () => {
    const accounts = [makeAccount('account-1', 'Checking'), makeAccount('account-2', 'Savings')];
    const checkingTransactions = [
      { amountInCents: 10000, movementType: 'INCOME' as const, dueDate: new Date() },
      { amountInCents: 3000, movementType: 'EXPENSE' as const, dueDate: new Date() },
    ];
    const savingsTransactions = [
      { amountInCents: 5000, movementType: 'TRANSFER_IN' as const, dueDate: new Date() },
      { amountInCents: 1500, movementType: 'TRANSFER_OUT' as const, dueDate: new Date() },
    ];
    const accountsRepository = {
      findAll: jest.fn().mockResolvedValue(Result.ok(accounts)),
    } as unknown as AccountsRepository;
    const listTransactionsReader = {
      listTransactions: jest
        .fn()
        .mockResolvedValueOnce(Result.ok(checkingTransactions))
        .mockResolvedValueOnce(Result.ok(savingsTransactions)),
      listTransactionsToEndDate: jest.fn(),
    } as unknown as ListTransactionsReader;
    calculateMock
      .mockReturnValueOnce(Money.create(95).value)
      .mockReturnValueOnce(Money.create(60).value);

    const handler = new ListAccountsHandler(accountsRepository, listTransactionsReader);

    const result = await handler.handle();

    expect(result.isSuccess).toBe(true);
    expect(result.value[0].account).toBe(accounts[0]);
    expect(result.value[0].balance.amountInCents).toBe(9500);
    expect(result.value[1].account).toBe(accounts[1]);
    expect(result.value[1].balance.amountInCents).toBe(6000);
    expect(accountsRepository.findAll).toHaveBeenCalledTimes(1);
    expect(listTransactionsReader.listTransactions).toHaveBeenCalledTimes(2);
    expect(listTransactionsReader.listTransactions).toHaveBeenNthCalledWith(1, {
      accountId: 'account-1',
      effectivated: true,
    });
    expect(listTransactionsReader.listTransactions).toHaveBeenNthCalledWith(2, {
      accountId: 'account-2',
      effectivated: true,
    });
    expect(calculateMock).toHaveBeenCalledTimes(2);
    expect(calculateMock).toHaveBeenNthCalledWith(1, accounts[0], checkingTransactions);
    expect(calculateMock).toHaveBeenNthCalledWith(2, accounts[1], savingsTransactions);
  });

  it('should calculate balances with effectivated transactions until the given end date', async () => {
    const endDate = new Date('2026-01-10T12:00:00.000Z');
    const accounts = [makeAccount('account-1', 'Checking'), makeAccount('account-2', 'Savings')];
    const checkingTransactions = [
      { amountInCents: 10000, movementType: 'INCOME' as const, dueDate: new Date() },
    ];
    const savingsTransactions = [
      { amountInCents: 1500, movementType: 'TRANSFER_OUT' as const, dueDate: new Date() },
    ];
    const accountsRepository = {
      findAll: jest.fn().mockResolvedValue(Result.ok(accounts)),
    } as unknown as AccountsRepository;
    const listTransactionsReader = {
      listTransactions: jest.fn(),
      listTransactionsToEndDate: jest
        .fn()
        .mockResolvedValueOnce(Result.ok(checkingTransactions))
        .mockResolvedValueOnce(Result.ok(savingsTransactions)),
    } as unknown as ListTransactionsReader;
    calculateMock
      .mockReturnValueOnce(Money.create(125).value)
      .mockReturnValueOnce(Money.create(10).value);

    const handler = new ListAccountsHandler(accountsRepository, listTransactionsReader);

    const result = await handler.handle({ endDate });

    expect(result.isSuccess).toBe(true);
    expect(listTransactionsReader.listTransactions).not.toHaveBeenCalled();
    expect(listTransactionsReader.listTransactionsToEndDate).toHaveBeenCalledTimes(2);
    expect(listTransactionsReader.listTransactionsToEndDate).toHaveBeenNthCalledWith(1, {
      accountId: 'account-1',
      effectivated: true,
      endDate: endOfDay(endDate),
    });
    expect(listTransactionsReader.listTransactionsToEndDate).toHaveBeenNthCalledWith(2, {
      accountId: 'account-2',
      effectivated: true,
      endDate: endOfDay(endDate),
    });
    expect(result.value[0].balance.amountInCents).toBe(12500);
    expect(result.value[1].balance.amountInCents).toBe(1000);
    expect(calculateMock).toHaveBeenNthCalledWith(1, accounts[0], checkingTransactions);
    expect(calculateMock).toHaveBeenNthCalledWith(2, accounts[1], savingsTransactions);
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

    const result = await handler.handle();

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
    expect(accountsRepository.findAll).toHaveBeenCalledTimes(1);
    expect(listTransactionsReader.listTransactions).not.toHaveBeenCalled();
  });

  it('should propagate transaction query failures', async () => {
    const accounts = [makeAccount('account-1', 'Checking')];
    const accountsRepository = {
      findAll: jest.fn().mockResolvedValue(Result.ok(accounts)),
    } as unknown as AccountsRepository;
    const listTransactionsReader = {
      listTransactions: jest.fn().mockResolvedValue(
        Result.fail({
          code: Errors.PRISMA_QUERY_ERROR,
          cls: 'test',
        }),
      ),
      listTransactionsToEndDate: jest.fn(),
    } as unknown as ListTransactionsReader;

    const handler = new ListAccountsHandler(accountsRepository, listTransactionsReader);

    const result = await handler.handle();

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
    expect(listTransactionsReader.listTransactions).toHaveBeenCalledTimes(1);
  });
});
