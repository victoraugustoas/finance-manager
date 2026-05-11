import { Errors } from '@/shared/base/Errors';
import { Account } from './Account';

describe('Account', () => {
  describe('create()', () => {
    it('should create an account with valid props', () => {
      const result = Account.create({
        name: 'Checking account',
        balance: 100.5,
        openingBalance: 25,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.name).toBe('Checking account');
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
      expect(result.errors[0].code).toBe(Errors.MONEY_NOT_FINITE);
    });

    it('should fail when openingBalance is not finite (Infinity)', () => {
      const result = Account.create({
        name: 'X',
        balance: 10,
        openingBalance: Infinity,
      });

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.MONEY_NOT_FINITE);
    });
  });

  describe('updateBalance()', () => {
    const makeAccount = (balance = 100) =>
      Account.create({ name: 'Test', balance, openingBalance: 0 }).value;

    describe('when effectivated is false', () => {
      it('should not change balance', () => {
        const account = makeAccount(100);
        account.updateBalance({
          updatedBy: 'NEW_TRANSACTION',
          type: 'EXPENSE',
          value: Account.create({ name: 'X', balance: 50, openingBalance: 0 }).value.balance,
          effectivated: false,
        });
        expect(account.balance.amount).toBe(100);
      });
    });

    describe('NEW_TRANSACTION', () => {
      it('should subtract balance on EXPENSE', () => {
        const account = makeAccount(100);
        const { value: expense } = Account.create({ name: 'X', balance: 30, openingBalance: 0 });
        account.updateBalance({
          updatedBy: 'NEW_TRANSACTION',
          type: 'EXPENSE',
          value: expense.balance,
          effectivated: true,
        });
        expect(account.balance.amount).toBe(70);
      });

      it('should add balance on INCOME', () => {
        const account = makeAccount(100);
        const { value: income } = Account.create({ name: 'X', balance: 50, openingBalance: 0 });
        account.updateBalance({
          updatedBy: 'NEW_TRANSACTION',
          type: 'INCOME',
          value: income.balance,
          effectivated: true,
        });
        expect(account.balance.amount).toBe(150);
      });
    });

    describe('EDIT', () => {
      it('should reverse old EXPENSE and apply new EXPENSE', () => {
        const account = makeAccount(100);
        const { value: a } = Account.create({ name: 'X', balance: 30, openingBalance: 0 });
        const { value: b } = Account.create({ name: 'X', balance: 50, openingBalance: 0 });
        account.updateBalance({
          updatedBy: 'EDIT',
          type: 'EXPENSE',
          oldValue: a.balance,
          newValue: b.balance,
          effectivated: true,
        });
        // 100 + 30 (reverse old) - 50 (apply new) = 80
        expect(account.balance.amount).toBe(80);
      });

      it('should reverse old INCOME and apply new INCOME', () => {
        const account = makeAccount(100);
        const { value: a } = Account.create({ name: 'X', balance: 40, openingBalance: 0 });
        const { value: b } = Account.create({ name: 'X', balance: 60, openingBalance: 0 });
        account.updateBalance({
          updatedBy: 'EDIT',
          type: 'INCOME',
          oldValue: a.balance,
          newValue: b.balance,
          effectivated: true,
        });
        // 100 - 40 (reverse old) + 60 (apply new) = 120
        expect(account.balance.amount).toBe(120);
      });
    });

    describe('DELETE', () => {
      it('should add back balance on EXPENSE deletion', () => {
        const account = makeAccount(70);
        const { value: expense } = Account.create({ name: 'X', balance: 30, openingBalance: 0 });
        account.updateBalance({
          updatedBy: 'DELETE',
          type: 'EXPENSE',
          oldValue: expense.balance,
          effectivated: true,
        });
        expect(account.balance.amount).toBe(100);
      });

      it('should subtract balance on INCOME deletion', () => {
        const account = makeAccount(150);
        const { value: income } = Account.create({ name: 'X', balance: 50, openingBalance: 0 });
        account.updateBalance({
          updatedBy: 'DELETE',
          type: 'INCOME',
          oldValue: income.balance,
          effectivated: true,
        });
        expect(account.balance.amount).toBe(100);
      });
    });
  });

  describe('actualBalance', () => {
    it('should return balance plus openingBalance', () => {
      const { value: account } = Account.create({
        name: 'Savings',
        balance: 50,
        openingBalance: 12.34,
      });

      const actual = account.actualBalance;

      expect(actual.amountInCents).toBe(6234);
      expect(actual.amount).toBe(62.34);
    });
  });
});
