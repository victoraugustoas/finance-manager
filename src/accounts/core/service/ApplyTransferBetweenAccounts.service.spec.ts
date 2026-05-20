import { Account } from '@/accounts/core/model/Account';
import { Money } from '@/shared/ValueObjects';
import { ApplyTransferBetweenAccountsService } from './ApplyTransferBetweenAccounts.service';

describe('ApplyTransferBetweenAccountsService', () => {
  const makeAccount = (balance: number) =>
    Account.new({ name: 'Test', balance, openingBalance: 0 });

  const money = (amount: number) => Money.new(amount);

  describe('applyTransfer()', () => {
    it('should apply both deduction and credit in a single call', () => {
      const origin = makeAccount(500);
      const destination = makeAccount(0);
      const service = new ApplyTransferBetweenAccountsService(origin, destination);

      service.applyTransfer(money(300), true);

      expect(origin.balance.amount).toBe(200);
      expect(destination.balance.amount).toBe(300);
    });

    it('should allow origin balance to go negative', () => {
      const origin = makeAccount(30);
      const destination = makeAccount(0);
      const service = new ApplyTransferBetweenAccountsService(origin, destination);

      service.applyTransfer(money(100), true);

      expect(origin.balance.amount).toBe(-70);
      expect(destination.balance.amount).toBe(100);
    });

    it('should handle zero amount without changing either balance', () => {
      const origin = makeAccount(100);
      const destination = makeAccount(50);
      const service = new ApplyTransferBetweenAccountsService(origin, destination);

      service.applyTransfer(money(0), true);

      expect(origin.balance.amount).toBe(100);
      expect(destination.balance.amount).toBe(50);
    });

    it('should not change balances when not effectivated', () => {
      const origin = makeAccount(500);
      const destination = makeAccount(100);
      const service = new ApplyTransferBetweenAccountsService(origin, destination);

      service.applyTransfer(money(300), false);

      expect(origin.balance.amount).toBe(500);
      expect(destination.balance.amount).toBe(100);
    });
  });
});
