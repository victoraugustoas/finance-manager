import { ListTransactionsReaderResult } from '@/reporting/core/ports/readers/ListTransactionsReader';
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
  amountInCents,
  movementType,
  dueDate: new Date('2026-05-15T12:00:00.000Z'),
});

describe('AccountBalanceCalculatorService', () => {
  const service = new AccountBalanceCalculatorService();

  it('should return opening balance when there are no transactions', () => {
    const balance = service.calculate(makeAccount(25), []);

    expect(balance.amountInCents).toBe(2500);
  });

  it('should add incomes and transfers in to the balance', () => {
    const balance = service.calculate(makeAccount(25), [
      makeTransaction(10000, 'INCOME'),
      makeTransaction(5000, 'TRANSFER_IN'),
    ]);

    expect(balance.amountInCents).toBe(17500);
  });

  it('should subtract expenses and transfers out from the balance', () => {
    const balance = service.calculate(makeAccount(25), [
      makeTransaction(3000, 'EXPENSE'),
      makeTransaction(1500, 'TRANSFER_OUT'),
    ]);

    expect(balance.amountInCents).toBe(-2000);
  });

  it('should calculate balance from mixed account movements', () => {
    const balance = service.calculate(makeAccount(25), [
      makeTransaction(10000, 'INCOME'),
      makeTransaction(3000, 'EXPENSE'),
      makeTransaction(5000, 'TRANSFER_IN'),
      makeTransaction(1500, 'TRANSFER_OUT'),
    ]);

    expect(balance.amountInCents).toBe(13000);
  });
});
