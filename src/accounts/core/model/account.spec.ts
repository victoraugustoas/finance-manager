import {Errors} from '@/shared/base/Errors';
import {Account} from './account';

describe('Account', () => {
  describe('create()', () => {
    it('should create an account with valid props', () => {
      const result = Account.create({
        name: 'Conta corrente',
        balance: 100.5,
        openingBalance: 25,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.name).toBe('Conta corrente');
      expect(result.value.balance.amount).toBe(100.5);
      expect(result.value.balance.amountInCents).toBe(10050);
      expect(result.value.openingBalance.amount).toBe(25);
      expect(result.value.openingBalance.amountInCents).toBe(2500);
    });

    it('should allow zero balance and opening balance', () => {
      const result = Account.create({
        name: 'Nova',
        balance: 0,
        openingBalance: 0,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.actualBalance.amountInCents).toBe(0);
    });

    it('should fail when balance is not finite (NaN)', () => {
      const result = Account.create({
        name: 'X',
        balance: NaN,
        openingBalance: 10,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe(Errors.MONEY_NOT_FINITE);
    });

    it('should fail when openingBalance is not finite (Infinity)', () => {
      const result = Account.create({
        name: 'X',
        balance: 10,
        openingBalance: Infinity,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe(Errors.MONEY_NOT_FINITE);
    });
  });

  describe('actualBalance', () => {
    it('should return balance plus openingBalance', () => {
      const {value: account} = Account.create({
        name: 'Poupança',
        balance: 50,
        openingBalance: 12.34,
      });

      const actual = account.actualBalance;

      expect(actual.amountInCents).toBe(6234);
      expect(actual.amount).toBe(62.34);
    });
  });
});
