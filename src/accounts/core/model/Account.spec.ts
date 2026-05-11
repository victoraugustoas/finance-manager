import { Errors } from '@/shared/base/Errors';
import { Money } from '@/shared/ValueObjects';
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
    const makeAccount = (balance: number) =>
      Account.create({ name: 'Test', balance, openingBalance: 0 }).value;

    const money = (amount: number) => Money.create(amount).value;

    describe('when effectivated is false', () => {
      it('should not change balance', () => {
        const account = makeAccount(100);
        account.updateBalance({
          updatedBy: 'NEW_TRANSACTION',
          type: 'EXPENSE',
          value: money(50),
          effectivated: false,
        });
        expect(account.balance.amount).toBe(100);
      });
    });

    describe('NEW_TRANSACTION', () => {
      it('should subtract balance on EXPENSE', () => {
        const account = makeAccount(100);
        account.updateBalance({
          updatedBy: 'NEW_TRANSACTION',
          type: 'EXPENSE',
          value: money(30),
          effectivated: true,
        });
        expect(account.balance.amount).toBe(70);
      });

      it('should add balance on INCOME', () => {
        const account = makeAccount(100);
        account.updateBalance({
          updatedBy: 'NEW_TRANSACTION',
          type: 'INCOME',
          value: money(50),
          effectivated: true,
        });
        expect(account.balance.amount).toBe(150);
      });
    });

    describe('EDIT', () => {
      it('should reverse old EXPENSE and apply new EXPENSE (negative balance)', () => {
        // balance -50, expense was 20, changed to 10 → -50 + 20 - 10 = -40
        const account = makeAccount(-50);
        account.updateBalance({
          updatedBy: 'EDIT',
          type: 'EXPENSE',
          oldValue: money(20),
          newValue: money(10),
          effectivated: true,
        });
        expect(account.balance.amount).toBe(-40);
      });

      it('should reverse old INCOME and apply new INCOME', () => {
        // balance 100, income was 40, changed to 60 → 100 - 40 + 60 = 120
        const account = makeAccount(100);
        account.updateBalance({
          updatedBy: 'EDIT',
          type: 'INCOME',
          oldValue: money(40),
          newValue: money(60),
          effectivated: true,
        });
        expect(account.balance.amount).toBe(120);
      });
    });

    describe('DELETE', () => {
      it('should add back balance on EXPENSE deletion', () => {
        const account = makeAccount(70);
        account.updateBalance({
          updatedBy: 'DELETE',
          type: 'EXPENSE',
          oldValue: money(30),
          effectivated: true,
        });
        expect(account.balance.amount).toBe(100);
      });

      it('should subtract balance on INCOME deletion', () => {
        const account = makeAccount(150);
        account.updateBalance({
          updatedBy: 'DELETE',
          type: 'INCOME',
          oldValue: money(50),
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
