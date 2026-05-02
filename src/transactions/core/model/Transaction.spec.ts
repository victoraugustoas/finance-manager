import {Errors} from '@/shared/base/Errors';
import {Transaction, TransactionProps, TransactionType,} from '@/transactions/core/model/Transaction';

function baseProps(overrides: Partial<TransactionProps> = {}): TransactionProps {
  const entryDate = new Date('2026-01-10T12:00:00.000Z');
  const dueDate = new Date('2026-01-15T12:00:00.000Z');
  return {
    name: 'Groceries',
    amount: 100,
    categoryId: 'cat-1',
    subCategoryId: 'sub-1',
    dueDate,
    entryDate,
    effectivated: false,
    accountId: 'acc-1',
    type: TransactionType.EXPENSE,
    ...overrides,
  };
}

describe('Transaction', () => {
  describe('create()', () => {
    it('should create a transaction with valid props', () => {
      const result = Transaction.create(baseProps());

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeInstanceOf(Transaction);
    });

    it('should allow dueDate on the same calendar day as entryDate', () => {
      const day = new Date('2026-03-01T08:00:00.000Z');
      const result = Transaction.create(
        baseProps({
          entryDate: day,
          dueDate: new Date('2026-03-01T22:00:00.000Z'),
        }),
      );

      expect(result.isSuccess).toBe(true);
    });

    it('should allow effectivated transaction when effectivatedDate is same day as entryDate', () => {
      const entryDate = new Date('2026-02-01T10:00:00.000Z');
      const result = Transaction.create(
        baseProps({
          entryDate,
          dueDate: entryDate,
          effectivated: true,
          effectivatedDate: new Date('2026-02-01T18:00:00.000Z'),
        }),
      );

      expect(result.isSuccess).toBe(true);
    });

    it('should fail when amount is zero', () => {
      const result = Transaction.create(baseProps({amount: 0}));

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe(Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE);
    });

    it('should fail when amount is negative', () => {
      const result = Transaction.create(baseProps({amount: -1}));

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe(Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE);
    });

    it('should fail when effectivated is true but effectivatedDate is missing', () => {
      const result = Transaction.create(baseProps({effectivated: true}));

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe(Errors.EFFECTIVATED_DATE_NOT_BE_NULL);
    });

    it('should fail when dueDate is before entryDate (different day)', () => {
      const entryDate = new Date('2026-04-10T12:00:00.000Z');
      const result = Transaction.create(
        baseProps({
          entryDate,
          dueDate: new Date('2026-04-09T12:00:00.000Z'),
        }),
      );

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe(Errors.TRANSACTION_DUE_DATE_NOT_AFTER_ENTRY_DATE);
    });

    it('should fail when effectivatedDate is before entryDate', () => {
      const entryDate = new Date('2026-05-01T12:00:00.000Z');
      const result = Transaction.create(
        baseProps({
          entryDate,
          dueDate: entryDate,
          effectivated: true,
          effectivatedDate: new Date('2026-04-30T12:00:00.000Z'),
        }),
      );

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe(Errors.TRANSACTION_EFFECTIVATED_DATE_NOT_AFTER_ENTRY_DATE);
    });
  });

  describe('effectivate()', () => {
    it('should succeed when effectivatedDate is on the same calendar day as entryDate', () => {
      const entryDate = new Date('2026-06-01T08:00:00.000Z');
      const transaction = Transaction.new(
        baseProps({
          entryDate,
          dueDate: entryDate,
          effectivatedDate: undefined,
        }),
      );

      const effectivatedAt = new Date('2026-06-01T20:00:00.000Z');
      const result = transaction.effectivate(effectivatedAt);

      expect(result.isSuccess).toBe(true);
      expect(transaction.props.effectivatedDate).toEqual(effectivatedAt);
    });

    it('should succeed when effectivatedDate is after entryDate', () => {
      const entryDate = new Date('2026-07-01T12:00:00.000Z');
      const transaction = Transaction.new(
        baseProps({
          entryDate,
          dueDate: new Date('2026-07-05T12:00:00.000Z'),
        }),
      );

      const effectivatedAt = new Date('2026-07-03T12:00:00.000Z');
      const result = transaction.effectivate(effectivatedAt);

      expect(result.isSuccess).toBe(true);
      expect(transaction.props.effectivatedDate).toEqual(effectivatedAt);
    });

    it('should fail when effectivatedDate is before entryDate', () => {
      const entryDate = new Date('2026-08-10T12:00:00.000Z');
      const transaction = Transaction.new(
        baseProps({
          entryDate,
          dueDate: new Date('2026-08-15T12:00:00.000Z'),
        }),
      );

      const result = transaction.effectivate(new Date('2026-08-09T12:00:00.000Z'));

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe(Errors.TRANSACTION_EFFECTIVATED_DATE_NOT_AFTER_ENTRY_DATE);
    });

    it('should not mutate effectivatedDate when validation fails', () => {
      const entryDate = new Date('2026-09-01T12:00:00.000Z');
      const previousDate = new Date('2026-09-05T12:00:00.000Z');
      const transaction = Transaction.new(
        baseProps({
          entryDate,
          dueDate: new Date('2026-09-10T12:00:00.000Z'),
          effectivatedDate: previousDate,
        }),
      );

      const result = transaction.effectivate(new Date('2026-08-31T12:00:00.000Z'));

      expect(result.isFailure).toBe(true);
      expect(transaction.props.effectivatedDate).toEqual(previousDate);
    });
  });
});
