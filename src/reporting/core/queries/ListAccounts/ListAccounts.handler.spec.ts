import { ListAccountsReader } from '@/reporting/core/ports/readers/ListAccountsReader';
import { ListAccountsHandler } from '@/reporting/core/queries/ListAccounts/ListAccounts.handler';
import { AccountBalanceCalculatorService } from '@/reporting/core/service/AccountBalanceCalculator/AccountBalanceCalculator.service';
import { Errors } from '@/shared/base/Errors';
import { Result } from '@/shared/base/Result';
import { Money } from '@/shared/ValueObjects';
import { endOfDay } from 'date-fns';

const makeAccount = (id: string, name: string) => ({
  id,
  name,
  openingBalance: Money.new(25),
});

describe('ListAccountsHandler', () => {
  it('should return all accounts with calculated and estimated balances until the required end date', async () => {
    const endDate = new Date('2026-06-16T10:30:00.000Z');
    const accounts = [makeAccount('account-1', 'Checking'), makeAccount('account-2', 'Savings')];
    const listAccountsReader = {
      read: jest.fn().mockResolvedValue(Result.ok(accounts)),
    } as unknown as ListAccountsReader;
    const accountBalanceCalculator = {
      calculate: jest
        .fn()
        .mockResolvedValueOnce(
          Result.ok({ balance: Money.new(95), estimatedBalance: Money.new(120) }),
        )
        .mockResolvedValueOnce(
          Result.ok({ balance: Money.new(60), estimatedBalance: Money.new(50) }),
        ),
    } as unknown as AccountBalanceCalculatorService;
    const handler = new ListAccountsHandler(listAccountsReader, accountBalanceCalculator);

    const result = await handler.handle({ endDate });
    const expectedEndDate = endOfDay(endDate);

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual([
      {
        account: accounts[0],
        balance: Money.new(95),
        estimatedBalance: Money.new(120),
      },
      {
        account: accounts[1],
        balance: Money.new(60),
        estimatedBalance: Money.new(50),
      },
    ]);
    expect(listAccountsReader.read).toHaveBeenCalledTimes(1);
    expect(accountBalanceCalculator.calculate).toHaveBeenCalledTimes(2);
    expect(accountBalanceCalculator.calculate).toHaveBeenNthCalledWith(1, {
      accountId: 'account-1',
      endDate: expectedEndDate,
    });
    expect(accountBalanceCalculator.calculate).toHaveBeenNthCalledWith(2, {
      accountId: 'account-2',
      endDate: expectedEndDate,
    });
  });

  it('should propagate account reader failures', async () => {
    const listAccountsReader = {
      read: jest.fn().mockResolvedValue(
        Result.fail({
          code: Errors.PRISMA_QUERY_ERROR,
          cls: 'test',
        }),
      ),
    } as unknown as ListAccountsReader;
    const accountBalanceCalculator = {
      calculate: jest.fn(),
    } as unknown as AccountBalanceCalculatorService;
    const handler = new ListAccountsHandler(listAccountsReader, accountBalanceCalculator);

    const result = await handler.handle({ endDate: new Date('2026-01-10T12:00:00.000Z') });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
    expect(listAccountsReader.read).toHaveBeenCalledTimes(1);
    expect(accountBalanceCalculator.calculate).not.toHaveBeenCalled();
  });

  it('should propagate balance calculation failures', async () => {
    const accounts = [makeAccount('account-1', 'Checking')];
    const listAccountsReader = {
      read: jest.fn().mockResolvedValue(Result.ok(accounts)),
    } as unknown as ListAccountsReader;
    const accountBalanceCalculator = {
      calculate: jest.fn().mockResolvedValue(
        Result.fail({
          code: Errors.PRISMA_QUERY_ERROR,
          cls: 'test',
        }),
      ),
    } as unknown as AccountBalanceCalculatorService;
    const handler = new ListAccountsHandler(listAccountsReader, accountBalanceCalculator);

    const result = await handler.handle({ endDate: new Date('2026-01-10T12:00:00.000Z') });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
    expect(accountBalanceCalculator.calculate).toHaveBeenCalledTimes(1);
  });
});
