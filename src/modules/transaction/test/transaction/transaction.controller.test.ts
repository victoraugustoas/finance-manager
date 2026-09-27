import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { Result } from '@/shared/base/result';
import { TransactionType } from '@/shared/enums/transaction-type';
import {
  AccountReferenceErrors,
  EditTransaction,
  Expense,
  ListExpensesQuery,
  ListIncomesQuery,
  ListTransfersQuery,
  RegisterExpense,
  RegisterIncome,
  RegisterTransfer,
  Transaction,
} from '@/modules/transaction';
import { TransactionController } from '../../infra/transaction/transaction.controller';

describe('TransactionController', () => {
  const executeMocks = () => ({
    registerExpense: jest.fn(),
    registerIncome: jest.fn(),
    registerTransfer: jest.fn(),
    editTransaction: jest.fn(),
    listExpenses: jest.fn(),
    listIncomes: jest.fn(),
    listTransfers: jest.fn(),
  });

  let mocks: ReturnType<typeof executeMocks>;
  let controller: TransactionController;

  beforeEach(() => {
    mocks = executeMocks();
    controller = new TransactionController(
      { execute: mocks.registerExpense } as unknown as RegisterExpense,
      { execute: mocks.registerIncome } as unknown as RegisterIncome,
      { execute: mocks.registerTransfer } as unknown as RegisterTransfer,
      { execute: mocks.editTransaction } as unknown as EditTransaction,
      { execute: mocks.listExpenses } as unknown as ListExpensesQuery,
      { execute: mocks.listIncomes } as unknown as ListIncomesQuery,
      { execute: mocks.listTransfers } as unknown as ListTransfersQuery,
    );
  });

  test('should pass the parsed period to the expenses query', async () => {
    mocks.listExpenses.mockResolvedValue(Result.ok([]));

    const response = await controller.listExpensesRoute({
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-01-31T23:59:59.999Z',
    });

    expect(mocks.listExpenses).toHaveBeenCalledWith({
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-01-31T23:59:59.999Z'),
    });
    expect(response).toEqual({ expenses: [] });
  });

  test('should leave the period undefined when no filter is sent', async () => {
    mocks.listTransfers.mockResolvedValue(Result.ok([]));

    await controller.listTransfersRoute({});

    expect(mocks.listTransfers).toHaveBeenCalledWith({
      startDate: undefined,
      endDate: undefined,
    });
  });

  test('should register an expense mapping paymentDate to the settlement date', async () => {
    const expense = Expense.create({
      name: 'Groceries',
      amount: 4990,
      categoryId: '11111111-1111-1111-1111-111111111111',
      subCategoryId: '22222222-2222-2222-2222-222222222222',
      accountId: '33333333-3333-3333-3333-333333333333',
      dueDate: new Date('2026-01-15T12:00:00.000Z'),
      entryDate: new Date('2026-01-10T12:00:00.000Z'),
      effectivated: false,
    });
    mocks.registerExpense.mockResolvedValue(Result.ok(expense));

    const response = await controller.registerExpenseRoute({
      name: 'Groceries',
      amount: 49.9,
      dueDate: '2026-01-15T12:00:00.000Z',
      entryDate: '2026-01-10T12:00:00.000Z',
      paymentDate: '2026-01-12T12:00:00.000Z',
      effectivated: false,
      accountId: '33333333-3333-3333-3333-333333333333',
      categoryId: '11111111-1111-1111-1111-111111111111',
      subCategoryId: '22222222-2222-2222-2222-222222222222',
    });

    expect(mocks.registerExpense).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 49.9,
        effectivatedDate: new Date('2026-01-12T12:00:00.000Z'),
      }),
    );
    expect(response.amount).toBe(49.9);
    expect(response.id).toBe(expense.id);
  });

  test('should translate a missing account into 404 when editing', async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    mocks.editTransaction.mockResolvedValue(Result.fail(AccountReferenceErrors.ACCOUNT_NOT_FOUND));

    await expect(
      controller.editIncome('44444444-4444-4444-4444-444444444444', {
        name: 'Salary',
        amount: 10,
        dueDate: '2026-01-15T12:00:00.000Z',
        entryDate: '2026-01-10T12:00:00.000Z',
        effectivated: false,
        accountId: '33333333-3333-3333-3333-333333333333',
        categoryId: '11111111-1111-1111-1111-111111111111',
        subCategoryId: '22222222-2222-2222-2222-222222222222',
      }),
    ).rejects.toThrow(NotFoundException);

    expect(mocks.editTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ type: TransactionType.INCOME }),
    );
  });

  test('should translate domain failures into 400 when registering a transfer', async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    mocks.registerTransfer.mockResolvedValue(Result.fail(Transaction.AMOUNT_NOT_POSITIVE));

    await expect(
      controller.registerTransferRoute({
        name: 'Savings transfer',
        amount: 0,
        dueDate: '2026-01-15T12:00:00.000Z',
        entryDate: '2026-01-10T12:00:00.000Z',
        effectivated: false,
        accountIdOrigin: '11111111-1111-1111-1111-111111111111',
        accountIdDestination: '22222222-2222-2222-2222-222222222222',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
