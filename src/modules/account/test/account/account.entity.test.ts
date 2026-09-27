import { Account } from '@/modules/account';

const accountId = '11111111-1111-1111-1111-111111111111';

describe('Account', () => {
  test('should create an account with valid props', () => {
    const result = Account.tryCreate({ name: 'Checking account', openingBalance: 2500 });

    expect(result.isOk).toBe(true);
    expect(result.instance.name).toBe('Checking account');
    expect(result.instance.openingBalance.amount).toBe(25);
    expect(result.instance.openingBalance.amountInCents).toBe(2500);
  });

  test('should allow a zero opening balance', () => {
    const result = Account.tryCreate({ name: 'Nova', openingBalance: 0 });

    expect(result.isOk).toBe(true);
    expect(result.instance.openingBalance.amountInCents).toBe(0);
  });

  test('should fail when the opening balance is not an integer amount of cents', () => {
    const result = Account.tryCreate({ name: 'X', openingBalance: 25.5 });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('MONEY_CENTS_NOT_INTEGER');
  });

  test('should throw on create when props are invalid', () => {
    expect(() => Account.create({ name: 'X', openingBalance: Number.NaN })).toThrow();
  });

  test('should compare accounts by id', () => {
    const account = Account.create({ id: accountId, name: 'Checking', openingBalance: 100 });
    const same = Account.create({ id: accountId, name: 'Renamed', openingBalance: 200 });

    expect(account.equals(same)).toBe(true);
  });

  test('should rename through a clone keeping the identity', () => {
    const account = Account.create({ id: accountId, name: 'Checking', openingBalance: 100 });

    const renamed = account.rename('Savings');

    expect(renamed.isOk).toBe(true);
    expect(renamed.instance.name).toBe('Savings');
    expect(renamed.instance.id).toBe(accountId);
    expect(account.name).toBe('Checking');
  });
});
