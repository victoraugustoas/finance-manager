import { Errors } from '@/shared/base/Errors';
import { Expense } from '@/transactions/core/model/Expense';
import {
  Transaction,
  TransactionProps,
  TransactionType,
} from '@/transactions/core/model/Transaction';

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
  describe('create()', () => {
    it('should create an expense with valid props without passing type', () => {
      const result = Expense.create(baseProps());

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeInstanceOf(Expense);
      expect(result.value).toBeInstanceOf(Transaction);
      expect(expenseProps(result.value!).type).toBe(TransactionType.EXPENSE);
    });

    it('should propagate Transaction validation failures', () => {
      const result = Expense.create(baseProps({ amount: 0 }));

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe(Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE);
    });
  });

  describe('new()', () => {
    it('should instantiate expense with EXPENSE type', () => {
      const expense = Expense.new(baseProps());

      expect(expense).toBeInstanceOf(Expense);
      expect(expenseProps(expense).type).toBe(TransactionType.EXPENSE);
    });
  });
});
