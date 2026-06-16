import { ListAccountsReader } from '@/reporting/core/ports/readers/ListAccountsReader';
import {
  ListTransactionsReader,
  ListTransactionsReaderResult,
} from '@/reporting/core/ports/readers/ListTransactionsReader';
import { Result } from '@/shared/base';
import { Money } from '@/shared/ValueObjects';
import { AccountBalanceCalculatorService } from './AccountBalanceCalculator.service';

const makeAccount = (openingBalance = 25) => ({
  id: 'account-1',
  name: 'Checking',
  openingBalance: Money.new(openingBalance),
});

const makeTransaction = (
  amountInCents: number,
  movementType: ListTransactionsReaderResult['movementType'],
): ListTransactionsReaderResult => ({
  id: `${movementType}-${amountInCents}`,
  name: `${movementType} movement`,
  amount: Money.fromCents(amountInCents).value,
  movementType,
  dueDate: new Date('2026-05-15T12:00:00.000Z'),
  entryDate: new Date('2026-05-01T12:00:00.000Z'),
  effectivated: true,
});

const makeService = (
  listAccountsReader: ListAccountsReader = { read: jest.fn() } as unknown as ListAccountsReader,
  listTransactionsReader: ListTransactionsReader = {
    listTransactions: jest.fn(),
    listTransactionsToEndDate: jest.fn(),
  } as unknown as ListTransactionsReader,
) => new AccountBalanceCalculatorService(listAccountsReader, listTransactionsReader);

describe('AccountBalanceCalculatorService', () => {
  it('should return opening balance when there are no transactions', () => {
    const service = makeService();

    const balance = service.accountBalanceCalculatorTransactions(Money.new(25), []);

    expect(balance.amountInCents).toBe(2500);
  });

  it('should add incomes and transfers in to the balance', () => {
    const service = makeService();

    const balance = service.accountBalanceCalculatorTransactions(Money.new(25), [
      makeTransaction(10000, 'INCOME'),
      makeTransaction(5000, 'TRANSFER_IN'),
    ]);

    expect(balance.amountInCents).toBe(17500);
  });

  it('should subtract expenses and transfers out from the balance', () => {
    const service = makeService();

    const balance = service.accountBalanceCalculatorTransactions(Money.new(25), [
      makeTransaction(3000, 'EXPENSE'),
      makeTransaction(1500, 'TRANSFER_OUT'),
    ]);

    expect(balance.amountInCents).toBe(-2000);
  });

  it('should calculate balance from mixed account movements', () => {
    const service = makeService();

    const balance = service.accountBalanceCalculatorTransactions(Money.new(25), [
      makeTransaction(10000, 'INCOME'),
      makeTransaction(3000, 'EXPENSE'),
      makeTransaction(5000, 'TRANSFER_IN'),
      makeTransaction(1500, 'TRANSFER_OUT'),
    ]);

    expect(balance.amountInCents).toBe(13000);
  });

  it('should calculate current and estimated balances until the end date', async () => {
    const endDate = new Date('2026-06-16T10:30:00.000Z');
    const account = makeAccount(25);
    const effectivatedTransactions = [makeTransaction(10000, 'INCOME')];
    const allTransactions = [...effectivatedTransactions, makeTransaction(3000, 'EXPENSE')];
    const listAccountsReader = {
      read: jest.fn().mockResolvedValue(Result.ok([account])),
    } as unknown as ListAccountsReader;
    const listTransactionsReader = {
      listTransactions: jest.fn(),
      listTransactionsToEndDate: jest
        .fn()
        .mockResolvedValueOnce(Result.ok(effectivatedTransactions))
        .mockResolvedValueOnce(Result.ok(allTransactions)),
    } as unknown as ListTransactionsReader;
    const service = makeService(listAccountsReader, listTransactionsReader);

    const result = await service.calculate({ accountId: account.id, endDate });

    expect(result.isSuccess).toBe(true);
    expect(result.value.balance.amountInCents).toBe(12500);
    expect(result.value.estimatedBalance.amountInCents).toBe(9500);
    expect(listTransactionsReader.listTransactionsToEndDate).toHaveBeenCalledTimes(2);
    expect(listTransactionsReader.listTransactionsToEndDate).toHaveBeenNthCalledWith(1, {
      accountId: account.id,
      effectivated: true,
      endDate: expect.any(Date),
    });
    expect(listTransactionsReader.listTransactionsToEndDate).toHaveBeenNthCalledWith(2, {
      accountId: account.id,
      endDate: expect.any(Date),
    });
  });
});
