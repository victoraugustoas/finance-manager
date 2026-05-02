import { Errors } from '@/shared/base/Errors';
import { Income } from '@/transactions/core/model/Income';
import {
  Transaction,
  TransactionProps,
  TransactionType,
} from '@/transactions/core/model/Transaction';

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
  describe('create()', () => {
    it('should create an income with valid props without passing type', () => {
      const result = Income.create(baseProps());

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeInstanceOf(Income);
      expect(result.value).toBeInstanceOf(Transaction);
      expect(incomeProps(result.value!).type).toBe(TransactionType.INCOME);
    });

    it('should propagate Transaction validation failures', () => {
      const result = Income.create(baseProps({ amount: 0 }));

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe(Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE);
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
