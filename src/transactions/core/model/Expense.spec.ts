import { Errors } from '@/shared/base/Errors';
import { Expense } from '@/transactions/core/model/Expense';
import {
  Transaction,
  TransactionProps,
  TransactionType,
} from '@/transactions/core/model/Transaction';
import { TransactionRegisteredEvent } from '@/transactions/core/events/TransactionRegisteredEvent';
import { TransactionEditedEvent } from '@/transactions/core/events/TransactionEditedEvent';

function expenseProps(expense: Expense): TransactionProps {
  return (expense as unknown as { props: TransactionProps }).props;
}

function baseProps(
  overrides: Partial<Omit<TransactionProps, 'type'>> = {},
): Omit<TransactionProps, 'type'> {
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
    ...overrides,
  };
}

describe('Expense', () => {
  describe('register()', () => {
    it('should return a successful Result with an Expense instance', () => {
      const result = Expense.register(baseProps());

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeInstanceOf(Expense);
    });

    it('should attach a TransactionRegisteredEvent to the expense', () => {
      const result = Expense.register(baseProps());

      expect(result.value.domainEvents).toHaveLength(1);
      expect(result.value.domainEvents[0]).toBeInstanceOf(TransactionRegisteredEvent);
    });

    it('should set the event name to transaction.registered', () => {
      const result = Expense.register(baseProps());

      expect(result.value.domainEvents[0].eventName).toBe('transaction.registered');
    });

    it('should set the event payload with the correct expense data', () => {
      const props = baseProps();
      const result = Expense.register(props);
      const expense = result.value;

      expect(expense.domainEvents[0].payload).toEqual({
        transactionId: expense.id,
        type: TransactionType.EXPENSE,
        amountInCents: props.amount,
        accountId: props.accountId,
        categoryId: props.categoryId,
        subCategoryId: props.subCategoryId,
        effectivated: props.effectivated,
      });
    });
  });

  describe('create()', () => {
    it('should create an expense with valid props without passing type', () => {
      const result = Expense.create(baseProps());

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeInstanceOf(Expense);
      expect(result.value).toBeInstanceOf(Transaction);
      expect(expenseProps(result.value!).type).toBe(TransactionType.EXPENSE);
    });

    it('should not attach any domain event', () => {
      const result = Expense.create(baseProps());

      expect(result.value.domainEvents).toHaveLength(0);
    });

    it('should fail when amount is zero', () => {
      const result = Expense.create(baseProps({ amount: 0 }));

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE);
    });

    it('should fail when amount is negative', () => {
      const result = Expense.create(baseProps({ amount: -1 }));

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE);
    });

    it('should fail when effectivated is true but effectivatedDate is missing', () => {
      const result = Expense.create(baseProps({ effectivated: true, effectivatedDate: undefined }));

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.EFFECTIVATED_DATE_NOT_BE_NULL);
    });

    it('should fail when dueDate is before entryDate', () => {
      const result = Expense.create(
        baseProps({
          entryDate: new Date('2026-01-10'),
          dueDate: new Date('2026-01-01'),
        }),
      );

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.TRANSACTION_DUE_DATE_NOT_AFTER_ENTRY_DATE);
    });

    it('should fail when effectivatedDate is before entryDate', () => {
      const result = Expense.create(
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
    it('should instantiate expense with EXPENSE type', () => {
      const expense = Expense.new(baseProps());

      expect(expense).toBeInstanceOf(Expense);
      expect(expenseProps(expense).type).toBe(TransactionType.EXPENSE);
    });
  });

  describe('edit()', () => {
    it('should mutate the expense props in place', () => {
      const expense = Expense.create(baseProps({ name: 'Original', amount: 100 })).value;

      expense.edit(baseProps({ name: 'Updated', amount: 200 }));

      expect(expenseProps(expense).name).toBe('Updated');
      expect(expenseProps(expense).amount).toBe(200);
    });

    it('should attach a TransactionEditedEvent to the expense', () => {
      const expense = Expense.create(baseProps()).value;

      expense.edit(baseProps({ name: 'Updated' }));

      expect(expense.domainEvents).toHaveLength(1);
      expect(expense.domainEvents[0]).toBeInstanceOf(TransactionEditedEvent);
    });

    it('should capture oldValues before mutation in the event payload', () => {
      const original = baseProps({ name: 'Original', amount: 100 });
      const expense = Expense.create(original).value;

      expense.edit(baseProps({ name: 'Updated', amount: 200 }));

      expect(expense.domainEvents[0].payload).toEqual(
        expect.objectContaining({
          oldValues: expect.objectContaining({ name: 'Original', amount: 100 }),
          newValues: expect.objectContaining({ name: 'Updated', amount: 200 }),
        }),
      );
    });

    it('should not add a domain event when validation fails', () => {
      const expense = Expense.create(baseProps()).value;

      const result = expense.edit(baseProps({ amount: 0 }));

      expect(result.isFailure).toBe(true);
      expect(expense.domainEvents).toHaveLength(0);
    });

    it('should not mutate props when validation fails', () => {
      const expense = Expense.create(baseProps({ name: 'Original', amount: 100 })).value;

      expense.edit(baseProps({ amount: -1 }));

      expect(expenseProps(expense).name).toBe('Original');
      expect(expenseProps(expense).amount).toBe(100);
    });
  });
});
