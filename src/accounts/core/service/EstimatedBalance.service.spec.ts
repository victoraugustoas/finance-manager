import { Account } from '@/accounts/core/model/Account';
import { ListTransactionsQueryResult } from '@/accounts/core/provider/ListTransactions.query';
import { EstimatedBalanceService } from './EstimatedBalance.service';

describe('EstimatedBalanceService', () => {
  const service = new EstimatedBalanceService();

  const makeAccount = (balance: number, openingBalance = 0) =>
    Account.new({ name: 'Test', balance, openingBalance });

  const makeTransaction = (
    amountInCents: number,
    movementType: ListTransactionsQueryResult['movementType'],
  ): ListTransactionsQueryResult => ({
    amountInCents,
    movementType,
    dueDate: new Date(),
  });

  describe('calculate()', () => {
    it('should return actualBalance when there are no transactions', () => {
      const account = makeAccount(100, 50);

      const result = service.calculate(account, []);

      expect(result.amount).toBe(150);
    });

    it('should add INCOME to actualBalance', () => {
      const account = makeAccount(100);

      const result = service.calculate(account, [makeTransaction(5000, 'INCOME')]);

      expect(result.amount).toBe(150);
    });

    it('should subtract EXPENSE from actualBalance', () => {
      const account = makeAccount(200);

      const result = service.calculate(account, [makeTransaction(3000, 'EXPENSE')]);

      expect(result.amount).toBe(170);
    });

    it('should add TRANSFER_IN to actualBalance', () => {
      const account = makeAccount(100);

      const result = service.calculate(account, [makeTransaction(2000, 'TRANSFER_IN')]);

      expect(result.amount).toBe(120);
    });

    it('should subtract TRANSFER_OUT from actualBalance', () => {
      const account = makeAccount(100);

      const result = service.calculate(account, [makeTransaction(2000, 'TRANSFER_OUT')]);

      expect(result.amount).toBe(80);
    });

    it('should accumulate multiple movements correctly', () => {
      const account = makeAccount(0, 1000);

      const result = service.calculate(account, [
        makeTransaction(50000, 'INCOME'),
        makeTransaction(20000, 'EXPENSE'),
        makeTransaction(10000, 'TRANSFER_IN'),
        makeTransaction(5000, 'TRANSFER_OUT'),
      ]);

      // actualBalance = 1000, +500 -200 +100 -50 = 1350
      expect(result.amount).toBe(1350);
    });

    it('should allow estimated balance to go negative', () => {
      const account = makeAccount(0);

      const result = service.calculate(account, [makeTransaction(10000, 'EXPENSE')]);

      expect(result.amount).toBe(-100);
    });
  });
});
