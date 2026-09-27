import { Effectivated, Transfer, TransferRegisteredEvent } from '@/modules/transaction';

const baseProps = {
  name: 'Savings transfer',
  amount: 15000,
  dueDate: new Date('2026-01-15T12:00:00.000Z'),
  entryDate: new Date('2026-01-10T12:00:00.000Z'),
  effectivated: false,
  accountIdOrigin: '11111111-1111-1111-1111-111111111111',
  accountIdDestination: '22222222-2222-2222-2222-222222222222',
};

describe('Transfer', () => {
  test('should create a valid transfer', () => {
    const result = Transfer.tryCreate(baseProps);

    expect(result.isOk).toBe(true);
    expect(result.instance.amount.amount).toBe(150);
  });

  test('should report every broken invariant at once', () => {
    const result = Transfer.tryCreate({
      ...baseProps,
      amount: 0,
      dueDate: new Date('2026-01-01T12:00:00.000Z'),
      effectivated: true,
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        Effectivated.DATE_REQUIRED,
        Transfer.AMOUNT_NOT_POSITIVE,
        Transfer.DUE_DATE_BEFORE_ENTRY_DATE,
      ]),
    );
  });

  test('should require both accounts', () => {
    const result = Transfer.tryCreate({
      ...baseProps,
      accountIdOrigin: '',
      accountIdDestination: '',
    });

    expect(result.errors).toEqual(
      expect.arrayContaining([
        Transfer.ACCOUNT_ORIGIN_REQUIRED,
        Transfer.ACCOUNT_DESTINATION_REQUIRED,
      ]),
    );
  });

  test('should carry a registered event when registered', () => {
    const transfer = Transfer.register(baseProps);

    expect(transfer.instance.peekEvents()[0]).toBeInstanceOf(TransferRegisteredEvent);
  });
});
