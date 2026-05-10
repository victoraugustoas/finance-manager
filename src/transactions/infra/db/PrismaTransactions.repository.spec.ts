import { PrismaTransactionsRepository } from '@/transactions/infra/db/PrismaTransactions.repository';
import { Errors } from '@/shared/base/Errors';
import { PrismaService } from '@/shared/infra/PrismaService';
import { Expense } from '@/transactions/core/model/Expense';
import { Income } from '@/transactions/core/model/Income';

jest.mock(
  'generated/prisma/client',
  () => ({ TransactionType: { INCOME: 'INCOME', EXPENSE: 'EXPENSE' } }),
  { virtual: true },
);

const dueDate = new Date('2026-01-15T12:00:00.000Z');
const entryDate = new Date('2026-01-10T12:00:00.000Z');
const effectivatedDate = new Date('2026-01-12T12:00:00.000Z');

const makeExpense = (overrides: Partial<Parameters<typeof Expense.new>[0]> = {}): Expense =>
  Expense.new({
    id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
    name: 'Groceries',
    amount: 49.9,
    categoryId: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
    subCategoryId: 'dddddddd-dddd-4ddd-dddd-dddddddddddd',
    accountId: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
    dueDate,
    entryDate,
    effectivated: false,
    ...overrides,
  });

const makeIncome = (overrides: Partial<Parameters<typeof Income.new>[0]> = {}): Income =>
  Income.new({
    id: 'eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee',
    name: 'Salary',
    amount: 3500,
    categoryId: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
    subCategoryId: 'dddddddd-dddd-4ddd-dddd-dddddddddddd',
    accountId: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
    dueDate,
    entryDate,
    effectivated: false,
    ...overrides,
  });

describe('PrismaTransactionsRepository', () => {
  let transactionCreate: jest.Mock;
  let prisma: PrismaService;
  let repository: PrismaTransactionsRepository;

  beforeEach(() => {
    transactionCreate = jest.fn().mockResolvedValue(undefined);
    prisma = { transaction: { create: transactionCreate } } as unknown as PrismaService;
    repository = new PrismaTransactionsRepository(prisma);
  });

  describe('saveExpense()', () => {
    it('should return ok when prisma create succeeds', async () => {
      const result = await repository.saveExpense(makeExpense());

      expect(result.isSuccess).toBe(true);
    });

    it('should call prisma with amount in cents and type EXPENSE', async () => {
      const expense = makeExpense();

      await repository.saveExpense(expense);

      expect(transactionCreate).toHaveBeenCalledTimes(1);
      expect(transactionCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: expense.amount.amountInCents,
          type: 'EXPENSE',
        }),
      });
    });

    it('should map all scalar fields correctly', async () => {
      const expense = makeExpense();

      await repository.saveExpense(expense);

      expect(transactionCreate).toHaveBeenCalledWith({
        data: {
          id: expense.id,
          name: 'Groceries',
          amount: expense.amount.amountInCents,
          notes: null,
          dueDate,
          entryDate,
          effectivatedDate: null,
          effectivated: false,
          type: 'EXPENSE',
          categoryId: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
          subCategoryId: 'dddddddd-dddd-4ddd-dddd-dddddddddddd',
          accountId: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
        },
      });
    });

    it('should pass notes and effectivatedDate when set on the expense', async () => {
      const expense = makeExpense({
        notes: 'weekly shop',
        effectivated: true,
        effectivatedDate,
      });

      await repository.saveExpense(expense);

      expect(transactionCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          notes: 'weekly shop',
          effectivated: true,
          effectivatedDate,
        }),
      });
    });

    it('should return PRISMA_INSERT_ERROR when prisma create throws', async () => {
      const dbError = new Error('unique constraint failed');
      transactionCreate.mockRejectedValue(dbError);

      const result = await repository.saveExpense(makeExpense());

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.PRISMA_INSERT_ERROR);
      expect(result.errors[0].cls).toBe('PrismaTransactionsRepository');
      expect(result.errors[0].data).toEqual({ error: String(dbError) });
    });
  });

  describe('saveIncome()', () => {
    it('should return ok when prisma create succeeds', async () => {
      const result = await repository.saveIncome(makeIncome());

      expect(result.isSuccess).toBe(true);
    });

    it('should call prisma with amount in cents and type INCOME', async () => {
      const income = makeIncome();

      await repository.saveIncome(income);

      expect(transactionCreate).toHaveBeenCalledTimes(1);
      expect(transactionCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: income.amount.amountInCents,
          type: 'INCOME',
        }),
      });
    });

    it('should map all scalar fields correctly', async () => {
      const income = makeIncome();

      await repository.saveIncome(income);

      expect(transactionCreate).toHaveBeenCalledWith({
        data: {
          id: income.id,
          name: 'Salary',
          amount: income.amount.amountInCents,
          notes: null,
          dueDate,
          entryDate,
          effectivatedDate: null,
          effectivated: false,
          type: 'INCOME',
          categoryId: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
          subCategoryId: 'dddddddd-dddd-4ddd-dddd-dddddddddddd',
          accountId: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
        },
      });
    });

    it('should pass notes and effectivatedDate when set on the income', async () => {
      const income = makeIncome({
        notes: 'monthly salary',
        effectivated: true,
        effectivatedDate,
      });

      await repository.saveIncome(income);

      expect(transactionCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          notes: 'monthly salary',
          effectivated: true,
          effectivatedDate,
        }),
      });
    });

    it('should return PRISMA_INSERT_ERROR when prisma create throws', async () => {
      const dbError = new Error('foreign key constraint failed');
      transactionCreate.mockRejectedValue(dbError);

      const result = await repository.saveIncome(makeIncome());

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.PRISMA_INSERT_ERROR);
      expect(result.errors[0].cls).toBe('PrismaTransactionsRepository');
      expect(result.errors[0].data).toEqual({ error: String(dbError) });
    });
  });
});
