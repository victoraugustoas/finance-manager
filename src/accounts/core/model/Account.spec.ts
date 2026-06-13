import { Errors } from '@/shared/base/Errors';
import { Account } from './Account';

describe('Account', () => {
  describe('create()', () => {
    it('should create an account with valid props', () => {
      const result = Account.create({
        name: 'Checking account',
        openingBalance: 25,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.name).toBe('Checking account');
      expect(result.value.openingBalance.amount).toBe(25);
      expect(result.value.openingBalance.amountInCents).toBe(2500);
    });

    it('should allow zero opening balance', () => {
      const result = Account.create({
        name: 'Nova',
        openingBalance: 0,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.openingBalance.amountInCents).toBe(0);
    });

    it('should fail when openingBalance is not finite', () => {
      const result = Account.create({
        name: 'X',
        openingBalance: Infinity,
      });

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.MONEY_NOT_FINITE);
    });
  });

  describe('new()', () => {
    it('should create an account without validation', () => {
      const account = Account.new({
        name: 'Quick account',
        openingBalance: 50,
      });

      expect(account.name).toBe('Quick account');
      expect(account.openingBalance.amount).toBe(50);
    });
  });
});
