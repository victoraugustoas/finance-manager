import { TransactionType } from '@/shared/enums/transaction-type';
import {
  Effectivated,
  Expense,
  Income,
  Transaction,
  TransactionEditedEvent,
  TransactionRegisteredEvent,
} from '@/modules/transaction';

const baseProps = {
  name: 'Groceries',
  amount: 4990,
  categoryId: '11111111-1111-1111-1111-111111111111',
  subCategoryId: '22222222-2222-2222-2222-222222222222',
  accountId: '33333333-3333-3333-3333-333333333333',
  dueDate: new Date('2026-01-15T12:00:00.000Z'),
  entryDate: new Date('2026-01-10T12:00:00.000Z'),
  effectivated: false,
};

describe('Expense', () => {
  test('should create a valid expense with the EXPENSE type', () => {
    const result = Expense.tryCreate(baseProps);

    expect(result.isOk).toBe(true);
    expect(result.instance.type).toBe(TransactionType.EXPENSE);
    expect(result.instance.amount.amount).toBe(49.9);
  });

  test('should fail when the amount is not positive', () => {
    const result = Expense.tryCreate({ ...baseProps, amount: 0 });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(Transaction.AMOUNT_NOT_POSITIVE);
  });

  test('should fail when the due date precedes the entry date', () => {
    const result = Expense.tryCreate({
      ...baseProps,
      dueDate: new Date('2026-01-01T12:00:00.000Z'),
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(Transaction.DUE_DATE_BEFORE_ENTRY_DATE);
  });

  test('should fail when effectivated without a date', () => {
    const result = Expense.tryCreate({ ...baseProps, effectivated: true });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(Effectivated.DATE_REQUIRED);
  });

  test('should fail when the effectivated date precedes the entry date', () => {
    const result = Expense.tryCreate({
      ...baseProps,
      effectivated: true,
      effectivatedDate: new Date('2026-01-05T12:00:00.000Z'),
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(Transaction.EFFECTIVATED_DATE_BEFORE_ENTRY_DATE);
  });

  test('should carry a registered event when registered', () => {
    const expense = Expense.register(baseProps);

    expect(expense.instance.peekEvents()).toHaveLength(1);
    expect(expense.instance.peekEvents()[0]).toBeInstanceOf(TransactionRegisteredEvent);
  });

  test('should return an edited clone carrying the edited event', () => {
    const expense = Expense.create(baseProps);

    const edited = expense.edit({ ...baseProps, amount: 9990 });

    expect(edited.isOk).toBe(true);
    expect(edited.instance.amount.amount).toBe(99.9);
    expect(edited.instance.id).toBe(expense.id);
    expect(edited.instance.peekEvents()[0]).toBeInstanceOf(TransactionEditedEvent);
    expect(expense.amount.amount).toBe(49.9);
  });

  test('should reject an edit that breaks an invariant', () => {
    const expense = Expense.create(baseProps);

    const edited = expense.edit({ ...baseProps, amount: -1 });

    expect(edited.isFailure).toBe(true);
    expect(edited.errors).toContain(Transaction.AMOUNT_NOT_POSITIVE);
  });
});

describe('Income', () => {
  test('should create a valid income with the INCOME type', () => {
    const result = Income.tryCreate({ ...baseProps, name: 'Salary', amount: 350000 });

    expect(result.isOk).toBe(true);
    expect(result.instance.type).toBe(TransactionType.INCOME);
    expect(result.instance.amount.amount).toBe(3500);
  });
});
