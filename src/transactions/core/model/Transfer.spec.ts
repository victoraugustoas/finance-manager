import { Errors } from '@/shared/base/Errors';
import { TransferRegisteredEvent } from '@/transactions/core/events/TransferRegisteredEvent';
import { Transfer, TransferProps } from '@/transactions/core/model/Transfer';

function baseProps(overrides: Partial<TransferProps> = {}): TransferProps {
  const entryDate = new Date('2026-01-10T12:00:00.000Z');
  const dueDate = new Date('2026-01-15T12:00:00.000Z');
  return {
    name: 'Transfer to savings',
    amount: 500,
    dueDate,
    entryDate,
    effectivated: false,
    accountIdOrigin: 'acc-origin',
    accountIdDestination: 'acc-destination',
    ...overrides,
  };
}

describe('Transfer', () => {
  describe('register()', () => {
    it('should return a successful Result with a Transfer instance', () => {
      const result = Transfer.register(baseProps());

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeInstanceOf(Transfer);
    });

    it('should attach a TransferRegisteredEvent to the transfer', () => {
      const result = Transfer.register(baseProps());

      expect(result.value.domainEvents).toHaveLength(1);
      expect(result.value.domainEvents[0]).toBeInstanceOf(TransferRegisteredEvent);
    });

    it('should set the event name to transfer.registered', () => {
      const result = Transfer.register(baseProps());

      expect(result.value.domainEvents[0].eventName).toBe('transfer.registered');
    });

    it('should set the event payload with the correct transfer data', () => {
      const props = baseProps();
      const result = Transfer.register(props);
      const transfer = result.value;

      expect(transfer.domainEvents[0].payload).toEqual({
        transactionId: transfer.id,
        amountInCents: props.amount,
        accountIdOrigin: props.accountIdOrigin,
        accountIdDestination: props.accountIdDestination,
        effectivated: props.effectivated,
      });
    });

    it('should propagate validation failure from create()', () => {
      const result = Transfer.register(baseProps({ amount: 0 }));

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE);
    });
  });

  describe('create()', () => {
    it('should create a non-effectivated transfer with valid props', () => {
      const result = Transfer.create(baseProps());

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeInstanceOf(Transfer);
    });

    it('should create an effectivated transfer with effectivatedDate on the same day as entryDate', () => {
      const entryDate = new Date('2026-01-10T12:00:00.000Z');
      const result = Transfer.create(
        baseProps({ effectivated: true, effectivatedDate: entryDate }),
      );

      expect(result.isSuccess).toBe(true);
    });

    it('should create an effectivated transfer with effectivatedDate after entryDate', () => {
      const result = Transfer.create(
        baseProps({
          effectivated: true,
          effectivatedDate: new Date('2026-01-12T12:00:00.000Z'),
        }),
      );

      expect(result.isSuccess).toBe(true);
    });

    it('should allow dueDate equal to entryDate', () => {
      const date = new Date('2026-01-10T12:00:00.000Z');
      const result = Transfer.create(baseProps({ entryDate: date, dueDate: date }));

      expect(result.isSuccess).toBe(true);
    });

    it('should not attach any domain event', () => {
      const result = Transfer.create(baseProps());

      expect(result.value.domainEvents).toHaveLength(0);
    });

    it('should fail when amount is zero', () => {
      const result = Transfer.create(baseProps({ amount: 0 }));

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE);
    });

    it('should fail when amount is negative', () => {
      const result = Transfer.create(baseProps({ amount: -1 }));

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE);
    });

    it('should fail when dueDate is before entryDate', () => {
      const result = Transfer.create(
        baseProps({
          entryDate: new Date('2026-01-10T12:00:00.000Z'),
          dueDate: new Date('2026-01-05T12:00:00.000Z'),
        }),
      );

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.TRANSACTION_DUE_DATE_NOT_AFTER_ENTRY_DATE);
    });

    it('should fail when effectivated is true but effectivatedDate is missing', () => {
      const result = Transfer.create(
        baseProps({ effectivated: true, effectivatedDate: undefined }),
      );

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.EFFECTIVATED_DATE_NOT_BE_NULL);
    });

    it('should fail when effectivatedDate is before entryDate', () => {
      const result = Transfer.create(
        baseProps({
          effectivated: true,
          effectivatedDate: new Date('2026-01-05T12:00:00.000Z'),
        }),
      );

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.TRANSACTION_EFFECTIVATED_DATE_NOT_AFTER_ENTRY_DATE);
    });

    it('should fail when accountIdOrigin is empty', () => {
      const result = Transfer.create(baseProps({ accountIdOrigin: '' }));

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.TRANSFER_ACCOUNT_ORIGIN_REQUIRED);
    });

    it('should fail when accountIdDestination is empty', () => {
      const result = Transfer.create(baseProps({ accountIdDestination: '' }));

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.TRANSFER_ACCOUNT_DESTINATION_REQUIRED);
    });
  });

  describe('new()', () => {
    it('should instantiate a Transfer without validation', () => {
      const transfer = Transfer.new(baseProps());

      expect(transfer).toBeInstanceOf(Transfer);
    });
  });
});
