import { Errors } from '@/shared/base/Errors';
import { Money } from '@/shared/ValueObjects';
import { Account } from './Account';
import { TransactionType } from '@/shared/enums/TransactionType';

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

  describe('new()', () => {
    it('should create an account without validation', () => {
      const account = Account.new({
        name: 'Quick account',
        balance: 200,
        openingBalance: 50,
      });

      expect(account.name).toBe('Quick account');
      expect(account.balance.amount).toBe(200);
      expect(account.openingBalance.amount).toBe(50);
    });
  });

  describe('creditBalance()', () => {
    it('should add the given value to account balance', () => {
      const { value: account } = Account.create({ name: 'Test', balance: 100, openingBalance: 0 });

      account.creditBalance(Money.create(40).value);

      expect(account.balance.amount).toBe(140);
    });

    it('should handle crediting zero', () => {
      const { value: account } = Account.create({ name: 'Test', balance: 75, openingBalance: 0 });

      account.creditBalance(Money.create(0).value);

      expect(account.balance.amount).toBe(75);
    });
  });

  describe('deduceBalance()', () => {
    it('should subtract the given value from account balance', () => {
      const { value: account } = Account.create({ name: 'Test', balance: 100, openingBalance: 0 });

      account.deduceBalance(Money.create(30).value);

      expect(account.balance.amount).toBe(70);
    });

    it('should allow balance to go negative', () => {
      const { value: account } = Account.create({ name: 'Test', balance: 20, openingBalance: 0 });

      account.deduceBalance(Money.create(50).value);

      expect(account.balance.amount).toBe(-30);
    });

    it('should handle deducing zero', () => {
      const { value: account } = Account.create({ name: 'Test', balance: 75, openingBalance: 0 });

      account.deduceBalance(Money.create(0).value);

      expect(account.balance.amount).toBe(75);
    });
  });

  describe('updateBalance()', () => {
    const makeAccount = (balance: number) =>
      Account.create({ name: 'Test', balance, openingBalance: 0 }).value;

    const money = (amount: number) => Money.create(amount).value;

    describe('NEW_TRANSACTION', () => {
      it('should subtract balance on effectivated EXPENSE', () => {
        const account = makeAccount(100);
        account.updateBalance({
          updatedBy: 'NEW_TRANSACTION',
          type: TransactionType.EXPENSE,
          value: money(30),
          effectivated: true,
        });
        expect(account.balance.amount).toBe(70);
      });

      it('should add balance on effectivated INCOME', () => {
        const account = makeAccount(100);
        account.updateBalance({
          updatedBy: 'NEW_TRANSACTION',
          type: TransactionType.INCOME,
          value: money(50),
          effectivated: true,
        });
        expect(account.balance.amount).toBe(150);
      });

      it('should not change balance when EXPENSE is not effectivated', () => {
        const account = makeAccount(100);
        account.updateBalance({
          updatedBy: 'NEW_TRANSACTION',
          type: TransactionType.EXPENSE,
          value: money(50),
          effectivated: false,
        });
        expect(account.balance.amount).toBe(100);
      });

      it('should not change balance when INCOME is not effectivated', () => {
        const account = makeAccount(100);
        account.updateBalance({
          updatedBy: 'NEW_TRANSACTION',
          type: TransactionType.INCOME,
          value: money(50),
          effectivated: false,
        });
        expect(account.balance.amount).toBe(100);
      });
    });

    describe('EDIT', () => {
      it('should add back old EXPENSE and subtract new when going from effectivated to not effectivated', () => {
        // balance -50, expense was 20 (effectivated), changed to 10 (not effectivated)
        // → -50 + 20 - 10 = -40
        const account = makeAccount(-50);
        account.updateBalance({
          updatedBy: 'EDIT',
          type: TransactionType.EXPENSE,
          oldValue: money(20),
          newValue: money(10),
          oldEffectivated: true,
          newEffectivated: false,
        });
        expect(account.balance.amount).toBe(-40);
      });

      it('should subtract old INCOME and add new when going from effectivated to not effectivated', () => {
        // balance 100, income was 40 (effectivated), changed to 60 (not effectivated)
        // → 100 - 40 + 60 = 120
        const account = makeAccount(100);
        account.updateBalance({
          updatedBy: 'EDIT',
          type: TransactionType.INCOME,
          oldValue: money(40),
          newValue: money(60),
          oldEffectivated: true,
          newEffectivated: false,
        });
        expect(account.balance.amount).toBe(120);
      });

      it('should only subtract new EXPENSE when going from not effectivated to effectivated', () => {
        const account = makeAccount(100);
        account.updateBalance({
          updatedBy: 'EDIT',
          type: TransactionType.EXPENSE,
          oldValue: money(20),
          newValue: money(30),
          oldEffectivated: false,
          newEffectivated: true,
        });
        expect(account.balance.amount).toBe(70);
      });

      it('should only add new INCOME when going from not effectivated to effectivated', () => {
        const account = makeAccount(100);
        account.updateBalance({
          updatedBy: 'EDIT',
          type: TransactionType.INCOME,
          oldValue: money(20),
          newValue: money(50),
          oldEffectivated: false,
          newEffectivated: true,
        });
        expect(account.balance.amount).toBe(150);
      });

      it('should not change balance when both EXPENSE states are effectivated', () => {
        const account = makeAccount(100);
        account.updateBalance({
          updatedBy: 'EDIT',
          type: TransactionType.EXPENSE,
          oldValue: money(20),
          newValue: money(30),
          oldEffectivated: true,
          newEffectivated: true,
        });
        expect(account.balance.amount).toBe(100);
      });

      it('should not change balance when both INCOME states are not effectivated', () => {
        const account = makeAccount(100);
        account.updateBalance({
          updatedBy: 'EDIT',
          type: TransactionType.INCOME,
          oldValue: money(20),
          newValue: money(50),
          oldEffectivated: false,
          newEffectivated: false,
        });
        expect(account.balance.amount).toBe(100);
      });

      it('should not change balance when both INCOME states are effectivated', () => {
        const account = makeAccount(100);
        account.updateBalance({
          updatedBy: 'EDIT',
          type: TransactionType.INCOME,
          oldValue: money(20),
          newValue: money(50),
          oldEffectivated: true,
          newEffectivated: true,
        });
        expect(account.balance.amount).toBe(100);
      });

      it('should not change balance when both EXPENSE states are not effectivated', () => {
        const account = makeAccount(100);
        account.updateBalance({
          updatedBy: 'EDIT',
          type: TransactionType.EXPENSE,
          oldValue: money(20),
          newValue: money(30),
          oldEffectivated: false,
          newEffectivated: false,
        });
        expect(account.balance.amount).toBe(100);
      });
    });

    describe('DELETE', () => {
      it('should add back balance on EXPENSE deletion', () => {
        const account = makeAccount(70);
        account.updateBalance({
          updatedBy: 'DELETE',
          type: TransactionType.EXPENSE,
          oldValue: money(30),
        });
        expect(account.balance.amount).toBe(100);
      });

      it('should subtract balance on INCOME deletion', () => {
        const account = makeAccount(150);
        account.updateBalance({
          updatedBy: 'DELETE',
          type: TransactionType.INCOME,
          oldValue: money(50),
        });
        expect(account.balance.amount).toBe(100);
      });
    });
  });
});
