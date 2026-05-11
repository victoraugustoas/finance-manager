import { Errors } from '@/shared/base/Errors';
import { Income } from '@/transactions/core/model/Income';
import {
  Transaction,
  TransactionProps,
  TransactionType,
} from '@/transactions/core/model/Transaction';
import { TransactionRegisteredEvent } from '@/transactions/core/events/TransactionRegisteredEvent';

function incomeProps(income: Income): TransactionProps {
  return (income as unknown as { props: TransactionProps }).props;
}

function baseProps(
  overrides: Partial<Omit<TransactionProps, 'type'>> = {},
): Omit<TransactionProps, 'type'> {
  const entryDate = new Date('2026-01-10T12:00:00.000Z');
  const dueDate = new Date('2026-01-15T12:00:00.000Z');
  return {
    name: 'Salary',
    amount: 5000,
    categoryId: 'cat-1',
    subCategoryId: 'sub-1',
    dueDate,
    entryDate,
    effectivated: false,
    accountId: 'acc-1',
    ...overrides,
  };
}

describe('Income', () => {
  describe('register()', () => {
    it('should return a successful Result with an Income instance', () => {
      const result = Income.register(baseProps());

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeInstanceOf(Income);
    });

    it('should attach a TransactionRegisteredEvent to the income', () => {
      const result = Income.register(baseProps());

      expect(result.value.domainEvents).toHaveLength(1);
      expect(result.value.domainEvents[0]).toBeInstanceOf(TransactionRegisteredEvent);
    });

    it('should set the event name to transaction.registered', () => {
      const result = Income.register(baseProps());

      expect(result.value.domainEvents[0].eventName).toBe('transaction.registered');
    });

    it('should set the event payload with the correct income data', () => {
      const props = baseProps();
      const result = Income.register(props);
      const income = result.value;

      expect(income.domainEvents[0].payload).toEqual({
        transactionId: income.id,
        type: TransactionType.INCOME,
        amountInCents: props.amount,
        accountId: props.accountId,
        categoryId: props.categoryId,
        subCategoryId: props.subCategoryId,
        effectivated: props.effectivated,
      });
    });
  });

  describe('create()', () => {
    it('should create an income with valid props without passing type', () => {
      const result = Income.create(baseProps());

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeInstanceOf(Income);
      expect(result.value).toBeInstanceOf(Transaction);
      expect(incomeProps(result.value!).type).toBe(TransactionType.INCOME);
    });

    it('should not attach any domain event', () => {
      const result = Income.create(baseProps());

      expect(result.value.domainEvents).toHaveLength(0);
    });

    it('should fail when amount is zero', () => {
      const result = Income.create(baseProps({ amount: 0 }));

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE);
    });

    it('should fail when amount is negative', () => {
      const result = Income.create(baseProps({ amount: -1 }));

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE);
    });

    it('should fail when effectivated is true but effectivatedDate is missing', () => {
      const result = Income.create(baseProps({ effectivated: true, effectivatedDate: undefined }));

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.EFFECTIVATED_DATE_NOT_BE_NULL);
    });

    it('should fail when dueDate is before entryDate', () => {
      const result = Income.create(
        baseProps({
          entryDate: new Date('2026-01-10'),
          dueDate: new Date('2026-01-01'),
        }),
      );

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.TRANSACTION_DUE_DATE_NOT_AFTER_ENTRY_DATE);
    });

    it('should fail when effectivatedDate is before entryDate', () => {
      const result = Income.create(
        baseProps({
          effectivated: true,
          entryDate: new Date('2026-01-10'),
          effectivatedDate: new Date('2026-01-05'),
        }),
      );

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.TRANSACTION_EFFECTIVATED_DATE_NOT_AFTER_ENTRY_DATE);
    });
  });

  describe('new()', () => {
    it('should instantiate income with INCOME type', () => {
      const income = Income.new(baseProps());

      expect(income).toBeInstanceOf(Income);
      expect(incomeProps(income).type).toBe(TransactionType.INCOME);
    });
  });
});
