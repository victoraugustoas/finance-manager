import { DomainEvent } from '@/shared/base/DomainEvent';
import { Errors } from '@/shared/base/Errors';
import {
  Transaction,
  TransactionProps,
  TransactionType,
} from '@/transactions/core/model/Transaction';

class StubEvent extends DomainEvent {
  constructor() {
    super();
  }
  get eventName() {
    return 'stub.event';
  }
  get payload() {
    return {};
  }
}

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
      const result = Transaction.create(baseProps({ amount: 0 }));

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE);
    });

    it('should fail when amount is negative', () => {
      const result = Transaction.create(baseProps({ amount: -1 }));

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE);
    });

    it('should fail when effectivated is true but effectivatedDate is missing', () => {
      const result = Transaction.create(baseProps({ effectivated: true }));

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.EFFECTIVATED_DATE_NOT_BE_NULL);
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
      expect(result.errors[0].code).toBe(Errors.TRANSACTION_DUE_DATE_NOT_AFTER_ENTRY_DATE);
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
      expect(result.errors[0].code).toBe(Errors.TRANSACTION_EFFECTIVATED_DATE_NOT_AFTER_ENTRY_DATE);
    });
  });

  describe('copyWith()', () => {
    it('should override the given props on the copy', () => {
      const transaction = Transaction.new(baseProps({ id: 'tx-1', name: 'Original' }));

      const copy = transaction.copyWith({ name: 'Updated' });

      expect(copy.props.name).toBe('Updated');
    });

    it('should preserve props not included in the overrides', () => {
      const transaction = Transaction.new(baseProps({ id: 'tx-1' }));

      const copy = transaction.copyWith({ name: 'Updated' });

      expect(copy.props.amount).toBe(100);
      expect(copy.props.type).toBe(TransactionType.EXPENSE);
      expect(copy.props.accountId).toBe('acc-1');
    });

    it('should preserve the id when the original was created with an explicit id', () => {
      const transaction = Transaction.new(baseProps({ id: 'explicit-id' }));

      const copy = transaction.copyWith({ name: 'Copy' });

      expect(copy.id).toBe('explicit-id');
    });

    it('should update the amount Money value object on the copy', () => {
      const transaction = Transaction.new(baseProps({ id: 'tx-1', amount: 100 }));

      const copy = transaction.copyWith({ amount: 200 });

      expect(copy.amount.amount).toBe(200);
      expect(transaction.amount.amount).toBe(100);
    });

    it('should update the effectivated value object on the copy', () => {
      const effectivatedDate = new Date('2026-06-01T12:00:00.000Z');
      const transaction = Transaction.new(baseProps({ id: 'tx-1', effectivated: false }));

      const copy = transaction.copyWith({ effectivated: true, effectivatedDate });

      expect(copy.effectivated.effectivated).toBe(true);
      expect(copy.effectivated.effectivatedDate).toBe(effectivatedDate);
    });

    it('should copy domain events from the original into the copy', () => {
      const transaction = Transaction.new(baseProps({ id: 'tx-1' }));
      transaction['addDomainEvent'](new StubEvent());

      const copy = transaction.copyWith({ name: 'Copy' });

      expect(copy.domainEvents).toHaveLength(1);
      expect(copy.domainEvents[0]).toBeInstanceOf(StubEvent);
    });

    it('should not share the events array between original and copy', () => {
      const transaction = Transaction.new(baseProps({ id: 'tx-1' }));
      transaction['addDomainEvent'](new StubEvent());

      const copy = transaction.copyWith({ name: 'Copy' });
      copy['addDomainEvent'](new StubEvent());

      expect(transaction.domainEvents).toHaveLength(1);
      expect(copy.domainEvents).toHaveLength(2);
    });

    it('should not mutate the original props', () => {
      const transaction = Transaction.new(baseProps({ id: 'tx-1', name: 'Original' }));

      transaction.copyWith({ name: 'Different', amount: 999 });

      expect(transaction.props.name).toBe('Original');
      expect(transaction.props.amount).toBe(100);
    });
  });

  describe('edit()', () => {
    it('should mutate the props on the original instance', () => {
      const transaction = Transaction.new(baseProps({ id: 'tx-1', name: 'Original', amount: 100 }));

      transaction.edit(baseProps({ name: 'Updated', amount: 200 }));

      expect(transaction.props.name).toBe('Updated');
      expect(transaction.props.amount).toBe(200);
    });

    it('should update the amount value object in place', () => {
      const transaction = Transaction.new(baseProps({ id: 'tx-1', amount: 100 }));

      transaction.edit(baseProps({ amount: 350 }));

      expect(transaction.amount.amount).toBe(350);
    });

    it('should preserve the id after edit', () => {
      const transaction = Transaction.new(baseProps({ id: 'tx-fixed' }));

      transaction.edit(baseProps({ name: 'Changed' }));

      expect(transaction.id).toBe('tx-fixed');
    });

    it('should return failure and not mutate when validation fails', () => {
      const transaction = Transaction.new(baseProps({ id: 'tx-1', name: 'Original', amount: 100 }));

      const result = transaction.edit(baseProps({ amount: -1 }));

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE);
      expect(transaction.props.name).toBe('Original');
      expect(transaction.props.amount).toBe(100);
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
      expect(result.errors[0].code).toBe(Errors.TRANSACTION_EFFECTIVATED_DATE_NOT_AFTER_ENTRY_DATE);
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
