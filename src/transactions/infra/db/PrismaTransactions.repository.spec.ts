import { PrismaTransactionsRepository } from '@/transactions/infra/db/PrismaTransactions.repository';
import { Errors } from '@/shared/base/Errors';
import { PrismaService } from '@/shared/infra/PrismaService';
import { Expense } from '@/transactions/core/model/Expense';
import { Income } from '@/transactions/core/model/Income';
import { Transfer } from '@/transactions/core/model/Transfer';

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

const makeTransfer = (overrides: Partial<Parameters<typeof Transfer.new>[0]> = {}): Transfer =>
  Transfer.new({
    id: 'ffffffff-ffff-4fff-ffff-ffffffffffff',
    name: 'Savings transfer',
    amount: 15000,
    accountIdOrigin: '11111111-1111-4111-1111-111111111111',
    accountIdDestination: '22222222-2222-4222-2222-222222222222',
    dueDate,
    entryDate,
    effectivated: false,
    ...overrides,
  });

describe('PrismaTransactionsRepository', () => {
  let transactionUpsert: jest.Mock;
  let transferUpsert: jest.Mock;
  let transactionFindFirst: jest.Mock;
  let prisma: PrismaService;
  let repository: PrismaTransactionsRepository;

  beforeEach(() => {
    transactionUpsert = jest.fn().mockResolvedValue(undefined);
    transferUpsert = jest.fn().mockResolvedValue(undefined);
    transactionFindFirst = jest.fn();

    prisma = {
      $transaction: jest.fn().mockImplementation((fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          transaction: { upsert: transactionUpsert },
          transfer: { upsert: transferUpsert },
          outboxEvent: { createMany: jest.fn().mockResolvedValue(undefined) },
        }),
      ),
      transaction: { findFirst: transactionFindFirst },
    } as unknown as PrismaService;

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

      expect(transactionUpsert).toHaveBeenCalledTimes(1);
      expect(transactionUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            amount: expense.amount.amountInCents,
            type: 'EXPENSE',
          }),
        }),
      );
    });

    it('should map all scalar fields correctly', async () => {
      const expense = makeExpense();

      await repository.saveExpense(expense);

      expect(transactionUpsert).toHaveBeenCalledWith({
        where: { id: expense.id },
        create: {
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
        update: {
          name: 'Groceries',
          amount: expense.amount.amountInCents,
          notes: null,
          dueDate,
          entryDate,
          effectivatedDate: null,
          effectivated: false,
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

      expect(transactionUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            notes: 'weekly shop',
            effectivated: true,
            effectivatedDate,
          }),
        }),
      );
    });

    it('should return PRISMA_INSERT_ERROR when prisma create throws', async () => {
      const dbError = new Error('unique constraint failed');
      transactionUpsert.mockRejectedValue(dbError);

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

      expect(transactionUpsert).toHaveBeenCalledTimes(1);
      expect(transactionUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            amount: income.amount.amountInCents,
            type: 'INCOME',
          }),
        }),
      );
    });

    it('should map all scalar fields correctly', async () => {
      const income = makeIncome();

      await repository.saveIncome(income);

      expect(transactionUpsert).toHaveBeenCalledWith({
        where: { id: income.id },
        create: {
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
        update: {
          name: 'Salary',
          amount: income.amount.amountInCents,
          notes: null,
          dueDate,
          entryDate,
          effectivatedDate: null,
          effectivated: false,
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

      expect(transactionUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            notes: 'monthly salary',
            effectivated: true,
            effectivatedDate,
          }),
        }),
      );
    });

    it('should return PRISMA_INSERT_ERROR when prisma create throws', async () => {
      const dbError = new Error('foreign key constraint failed');
      transactionUpsert.mockRejectedValue(dbError);

      const result = await repository.saveIncome(makeIncome());

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.PRISMA_INSERT_ERROR);
      expect(result.errors[0].cls).toBe('PrismaTransactionsRepository');
      expect(result.errors[0].data).toEqual({ error: String(dbError) });
    });
  });

  describe('saveTransfer()', () => {
    it('should return ok when prisma upsert succeeds', async () => {
      const result = await repository.saveTransfer(makeTransfer());

      expect(result.isSuccess).toBe(true);
    });

    it('should map all scalar fields correctly', async () => {
      const transfer = makeTransfer();

      await repository.saveTransfer(transfer);

      expect(transferUpsert).toHaveBeenCalledWith({
        where: { id: transfer.id },
        create: {
          id: transfer.id,
          name: 'Savings transfer',
          amount: 15000,
          notes: null,
          dueDate,
          entryDate,
          effectivatedDate: null,
          effectivated: false,
          accountIdOrigin: '11111111-1111-4111-1111-111111111111',
          accountIdDestination: '22222222-2222-4222-2222-222222222222',
        },
        update: {
          name: 'Savings transfer',
          amount: 15000,
          notes: null,
          dueDate,
          entryDate,
          effectivatedDate: null,
          effectivated: false,
          accountIdOrigin: '11111111-1111-4111-1111-111111111111',
          accountIdDestination: '22222222-2222-4222-2222-222222222222',
        },
      });
    });

    it('should pass notes and effectivatedDate when set on the transfer', async () => {
      const transfer = makeTransfer({
        notes: 'end of month',
        effectivated: true,
        effectivatedDate,
      });

      await repository.saveTransfer(transfer);

      expect(transferUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            notes: 'end of month',
            effectivated: true,
            effectivatedDate,
          }),
        }),
      );
    });

    it('should not call transaction upsert', async () => {
      await repository.saveTransfer(makeTransfer());

      expect(transactionUpsert).not.toHaveBeenCalled();
    });

    it('should return PRISMA_INSERT_ERROR when prisma upsert throws', async () => {
      const dbError = new Error('foreign key constraint failed');
      transferUpsert.mockRejectedValue(dbError);

      const result = await repository.saveTransfer(makeTransfer());

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.PRISMA_INSERT_ERROR);
      expect(result.errors[0].cls).toBe('PrismaTransactionsRepository');
      expect(result.errors[0].data).toEqual({ error: String(dbError) });
    });
  });

  describe('findIncomeById()', () => {
    const rawIncome = {
      id: 'eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee',
      name: 'Salary',
      amount: 350000,
      notes: null,
      dueDate,
      entryDate,
      effectivatedDate: null,
      effectivated: false,
      categoryId: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
      subCategoryId: 'dddddddd-dddd-4ddd-dddd-dddddddddddd',
      accountId: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
    };

    it('should return a reconstructed Income when found', async () => {
      transactionFindFirst.mockResolvedValue(rawIncome);

      const result = await repository.findIncomeById(rawIncome.id);

      expect(result.isSuccess).toBe(true);
      expect(result.value.id).toBe(rawIncome.id);
      expect(result.value.props.name).toBe('Salary');
      expect(result.value.amount.amountInCents).toBe(350000);
    });

    it('should query by id and type INCOME', async () => {
      transactionFindFirst.mockResolvedValue(rawIncome);

      await repository.findIncomeById(rawIncome.id);

      expect(transactionFindFirst).toHaveBeenCalledWith({
        where: { id: rawIncome.id, type: 'INCOME' },
      });
    });

    it('should return PRISMA_QUERY_ERROR when not found', async () => {
      transactionFindFirst.mockResolvedValue(null);

      const result = await repository.findIncomeById('missing-id');

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
    });

    it('should return PRISMA_QUERY_ERROR when findFirst throws', async () => {
      transactionFindFirst.mockRejectedValue(new Error('Connection lost'));

      const result = await repository.findIncomeById(rawIncome.id);

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
    });
  });

  describe('findExpenseById()', () => {
    const rawExpense = {
      id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
      name: 'Groceries',
      amount: 4990,
      notes: null,
      dueDate,
      entryDate,
      effectivatedDate: null,
      effectivated: false,
      categoryId: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
      subCategoryId: 'dddddddd-dddd-4ddd-dddd-dddddddddddd',
      accountId: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
    };

    it('should return a reconstructed Expense when found', async () => {
      transactionFindFirst.mockResolvedValue(rawExpense);

      const result = await repository.findExpenseById(rawExpense.id);

      expect(result.isSuccess).toBe(true);
      expect(result.value.id).toBe(rawExpense.id);
      expect(result.value.props.name).toBe('Groceries');
      expect(result.value.amount.amountInCents).toBe(4990);
    });

    it('should query by id and type EXPENSE', async () => {
      transactionFindFirst.mockResolvedValue(rawExpense);

      await repository.findExpenseById(rawExpense.id);

      expect(transactionFindFirst).toHaveBeenCalledWith({
        where: { id: rawExpense.id, type: 'EXPENSE' },
      });
    });

    it('should return PRISMA_QUERY_ERROR when not found', async () => {
      transactionFindFirst.mockResolvedValue(null);

      const result = await repository.findExpenseById('missing-id');

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
    });

    it('should return PRISMA_QUERY_ERROR when findFirst throws', async () => {
      transactionFindFirst.mockRejectedValue(new Error('Connection lost'));

      const result = await repository.findExpenseById(rawExpense.id);

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
    });
  });
});
