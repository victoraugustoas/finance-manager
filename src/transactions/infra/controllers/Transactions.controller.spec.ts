import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TransactionsController } from '@/transactions/infra/controllers/Transactions.controller';
import { RegisterExpenseUseCase } from '@/transactions/core/usecases/RegisterExpense.usecase';
import { RegisterIncomeUseCase } from '@/transactions/core/usecases/RegisterIncome.usecase';
import { RegisterTransferUseCase } from '@/transactions/core/usecases/RegisterTransfer.usecase';
import { EditTransactionUseCase } from '@/transactions/core/usecases/EditTransaction.usecase';
import { RegisterExpenseDto } from '@/transactions/infra/dtos/RegisterExpense.dto';
import { RegisterIncomeDto } from '@/transactions/infra/dtos/RegisterIncome.dto';
import { RegisterTransferDto } from '@/transactions/infra/dtos/RegisterTransfer.dto';
import { EditExpenseDto } from '@/transactions/infra/dtos/EditExpense.dto';
import { EditIncomeDto } from '@/transactions/infra/dtos/EditIncome.dto';
import { Expense } from '@/transactions/core/model/Expense';
import { Income } from '@/transactions/core/model/Income';
import { TransactionType } from '@/shared/enums/TransactionType';
import { Errors } from '@/shared/base/Errors';
import { Result } from '@/shared/base/Result';

const makeExpense = (): Expense =>
  Expense.new({
    id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
    name: 'Groceries',
    amount: 49.9,
    categoryId: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
    subCategoryId: 'dddddddd-dddd-4ddd-dddd-dddddddddddd',
    accountId: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
    dueDate: new Date('2026-01-15T12:00:00.000Z'),
    entryDate: new Date('2026-01-10T12:00:00.000Z'),
    effectivated: false,
  });

const makeIncome = (): Income =>
  Income.new({
    id: 'eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee',
    name: 'Salary',
    amount: 3500,
    categoryId: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
    subCategoryId: 'dddddddd-dddd-4ddd-dddd-dddddddddddd',
    accountId: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
    dueDate: new Date('2026-01-31T12:00:00.000Z'),
    entryDate: new Date('2026-01-01T12:00:00.000Z'),
    effectivated: false,
  });

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let registerExpenseMock: jest.Mock;
  let registerIncomeMock: jest.Mock;
  let registerTransferMock: jest.Mock;
  let editTransactionMock: jest.Mock;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    registerExpenseMock = jest.fn();
    registerIncomeMock = jest.fn();
    registerTransferMock = jest.fn();
    editTransactionMock = jest.fn();
    controller = new TransactionsController(
      { execute: registerExpenseMock } as unknown as RegisterExpenseUseCase,
      { execute: registerIncomeMock } as unknown as RegisterIncomeUseCase,
      { execute: registerTransferMock } as unknown as RegisterTransferUseCase,
      { execute: editTransactionMock } as unknown as EditTransactionUseCase,
    );
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  describe('registerExpense()', () => {
    const baseDto: RegisterExpenseDto = {
      name: 'Groceries',
      amount: 49.9,
      dueDate: '2026-01-15T12:00:00.000Z',
      entryDate: '2026-01-10T12:00:00.000Z',
      effectivated: false,
      accountId: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
      categoryId: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
      subCategoryId: 'dddddddd-dddd-4ddd-dddd-dddddddddddd',
    };

    it('should call RegisterExpenseUseCase.execute with dates parsed and optional fields mapped', async () => {
      registerExpenseMock.mockResolvedValue(Result.ok(makeExpense()));

      await controller.registerExpense(baseDto);

      expect(registerExpenseMock).toHaveBeenCalledTimes(1);
      expect(registerExpenseMock).toHaveBeenCalledWith({
        name: 'Groceries',
        amount: 49.9,
        dueDate: new Date('2026-01-15T12:00:00.000Z'),
        entryDate: new Date('2026-01-10T12:00:00.000Z'),
        paymentDate: undefined,
        effectivated: false,
        accountId: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
        categoryId: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
        subCategoryId: 'dddddddd-dddd-4ddd-dddd-dddddddddddd',
        notes: undefined,
      });
    });

    it('should parse paymentDate to Date when provided', async () => {
      registerExpenseMock.mockResolvedValue(Result.ok(makeExpense()));
      const dto = { ...baseDto, paymentDate: '2026-01-12T12:00:00.000Z' };

      await controller.registerExpense(dto);

      expect(registerExpenseMock).toHaveBeenCalledWith(
        expect.objectContaining({ paymentDate: new Date('2026-01-12T12:00:00.000Z') }),
      );
    });

    it('should return a response DTO mapped from the domain value', async () => {
      const expense = makeExpense();
      registerExpenseMock.mockResolvedValue(Result.ok(expense));

      const response = await controller.registerExpense(baseDto);

      expect(response.id).toBe(expense.id);
      expect(response.name).toBe(expense.props.name);
      expect(response.amount).toBe(expense.amount.amount);
      expect(response.categoryId).toBe(expense.props.categoryId);
      expect(response.subCategoryId).toBe(expense.props.subCategoryId);
      expect(response.accountId).toBe(expense.props.accountId);
      expect(response.effectivated).toBe(false);
    });

    it('should log and throw InternalServerErrorException on PRISMA_QUERY_ERROR', async () => {
      registerExpenseMock.mockResolvedValue(Result.fail({ code: Errors.PRISMA_QUERY_ERROR }));

      await expect(controller.registerExpense(baseDto)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      expect(String(loggerErrorSpy.mock.calls[0]?.[0])).toContain('Error during register expense');
    });

    it('should throw BadRequestException on domain validation error', async () => {
      registerExpenseMock.mockResolvedValue(
        Result.fail({ code: Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE }),
      );

      await expect(controller.registerExpense(baseDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when category is not found', async () => {
      registerExpenseMock.mockResolvedValue(
        Result.fail({ code: Errors.REFERENCE_CATEGORY_NOT_FOUND }),
      );

      await expect(controller.registerExpense(baseDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('registerIncome()', () => {
    const baseDto: RegisterIncomeDto = {
      name: 'Salary',
      amount: 3500,
      dueDate: '2026-01-31T12:00:00.000Z',
      entryDate: '2026-01-01T12:00:00.000Z',
      effectivated: false,
      accountId: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
      categoryId: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
      subCategoryId: 'dddddddd-dddd-4ddd-dddd-dddddddddddd',
    };

    it('should call RegisterIncomeUseCase.execute with dates parsed and optional fields mapped', async () => {
      registerIncomeMock.mockResolvedValue(Result.ok(makeIncome()));

      await controller.registerIncome(baseDto);

      expect(registerIncomeMock).toHaveBeenCalledTimes(1);
      expect(registerIncomeMock).toHaveBeenCalledWith({
        name: 'Salary',
        amount: 3500,
        dueDate: new Date('2026-01-31T12:00:00.000Z'),
        entryDate: new Date('2026-01-01T12:00:00.000Z'),
        receiptDate: undefined,
        effectivated: false,
        accountId: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
        categoryId: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
        subCategoryId: 'dddddddd-dddd-4ddd-dddd-dddddddddddd',
        notes: undefined,
      });
    });

    it('should parse receiptDate to Date when provided', async () => {
      registerIncomeMock.mockResolvedValue(Result.ok(makeIncome()));
      const dto = { ...baseDto, receiptDate: '2026-01-05T12:00:00.000Z' };

      await controller.registerIncome(dto);

      expect(registerIncomeMock).toHaveBeenCalledWith(
        expect.objectContaining({ receiptDate: new Date('2026-01-05T12:00:00.000Z') }),
      );
    });

    it('should return a response DTO mapped from the domain value', async () => {
      const income = makeIncome();
      registerIncomeMock.mockResolvedValue(Result.ok(income));

      const response = await controller.registerIncome(baseDto);

      expect(response.id).toBe(income.id);
      expect(response.name).toBe(income.props.name);
      expect(response.amount).toBe(income.amount.amount);
      expect(response.categoryId).toBe(income.props.categoryId);
      expect(response.subCategoryId).toBe(income.props.subCategoryId);
      expect(response.accountId).toBe(income.props.accountId);
      expect(response.effectivated).toBe(false);
    });

    it('should log and throw InternalServerErrorException on PRISMA_QUERY_ERROR', async () => {
      registerIncomeMock.mockResolvedValue(Result.fail({ code: Errors.PRISMA_QUERY_ERROR }));

      await expect(controller.registerIncome(baseDto)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      expect(String(loggerErrorSpy.mock.calls[0]?.[0])).toContain('Error during register income');
    });

    it('should throw BadRequestException on domain validation error', async () => {
      registerIncomeMock.mockResolvedValue(
        Result.fail({ code: Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE }),
      );

      await expect(controller.registerIncome(baseDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when subcategory is not found', async () => {
      registerIncomeMock.mockResolvedValue(
        Result.fail({ code: Errors.REFERENCE_SUBCATEGORY_NOT_FOUND }),
      );

      await expect(controller.registerIncome(baseDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('registerTransfer()', () => {
    const baseDto: RegisterTransferDto = {
      name: 'Savings transfer',
      amount: 150,
      dueDate: '2026-01-15T12:00:00.000Z',
      entryDate: '2026-01-10T12:00:00.000Z',
      effectivated: false,
      accountIdOrigin: '11111111-1111-4111-1111-111111111111',
      accountIdDestination: '22222222-2222-4222-2222-222222222222',
    };

    it('should call RegisterTransferUseCase.execute with dates parsed and optional fields mapped', async () => {
      registerTransferMock.mockResolvedValue(Result.ok(undefined));

      await controller.registerTransfer(baseDto);

      expect(registerTransferMock).toHaveBeenCalledTimes(1);
      expect(registerTransferMock).toHaveBeenCalledWith({
        name: 'Savings transfer',
        amount: 150,
        dueDate: new Date('2026-01-15T12:00:00.000Z'),
        entryDate: new Date('2026-01-10T12:00:00.000Z'),
        effectivatedDate: undefined,
        effectivated: false,
        accountIdOrigin: '11111111-1111-4111-1111-111111111111',
        accountIdDestination: '22222222-2222-4222-2222-222222222222',
        notes: undefined,
      });
    });

    it('should parse effectivatedDate when provided', async () => {
      registerTransferMock.mockResolvedValue(Result.ok(undefined));
      const dto = { ...baseDto, effectivatedDate: '2026-01-12T12:00:00.000Z' };

      await controller.registerTransfer(dto);

      expect(registerTransferMock).toHaveBeenCalledWith(
        expect.objectContaining({ effectivatedDate: new Date('2026-01-12T12:00:00.000Z') }),
      );
    });

    it('should return undefined (201 no body) on success', async () => {
      registerTransferMock.mockResolvedValue(Result.ok(undefined));

      const response = await controller.registerTransfer(baseDto);

      expect(response).toBeUndefined();
    });

    it('should log and throw InternalServerErrorException on PRISMA_INSERT_ERROR', async () => {
      registerTransferMock.mockResolvedValue(Result.fail({ code: Errors.PRISMA_INSERT_ERROR }));

      await expect(controller.registerTransfer(baseDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      expect(String(loggerErrorSpy.mock.calls[0]?.[0])).toContain('Error during register transfer');
    });

    it('should throw BadRequestException on domain validation error', async () => {
      registerTransferMock.mockResolvedValue(
        Result.fail({ code: Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE }),
      );

      await expect(controller.registerTransfer(baseDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on due date before entry date', async () => {
      registerTransferMock.mockResolvedValue(
        Result.fail({ code: Errors.TRANSACTION_DUE_DATE_NOT_AFTER_ENTRY_DATE }),
      );

      await expect(controller.registerTransfer(baseDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('editExpense()', () => {
    const id = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
    const baseDto: EditExpenseDto = {
      name: 'Groceries',
      amount: 49.9,
      dueDate: '2026-01-15T12:00:00.000Z',
      entryDate: '2026-01-10T12:00:00.000Z',
      effectivated: false,
      accountId: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
      categoryId: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
      subCategoryId: 'dddddddd-dddd-4ddd-dddd-dddddddddddd',
    };

    it('should call EditTransactionUseCase.execute with id, EXPENSE type, parsed dates and optional fields mapped', async () => {
      editTransactionMock.mockResolvedValue(Result.ok(undefined));

      await controller.editExpense(id, baseDto);

      expect(editTransactionMock).toHaveBeenCalledTimes(1);
      expect(editTransactionMock).toHaveBeenCalledWith({
        id,
        type: TransactionType.EXPENSE,
        name: 'Groceries',
        amount: 49.9,
        dueDate: new Date('2026-01-15T12:00:00.000Z'),
        entryDate: new Date('2026-01-10T12:00:00.000Z'),
        effectivatedDate: undefined,
        effectivated: false,
        accountId: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
        categoryId: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
        subCategoryId: 'dddddddd-dddd-4ddd-dddd-dddddddddddd',
        notes: undefined,
      });
    });

    it('should parse effectivatedDate when provided', async () => {
      editTransactionMock.mockResolvedValue(Result.ok(undefined));
      const dto: EditExpenseDto = { ...baseDto, effectivatedDate: '2026-01-12T12:00:00.000Z' };

      await controller.editExpense(id, dto);

      expect(editTransactionMock).toHaveBeenCalledWith(
        expect.objectContaining({ effectivatedDate: new Date('2026-01-12T12:00:00.000Z') }),
      );
    });

    it('should return undefined (204 No Content) on success', async () => {
      editTransactionMock.mockResolvedValue(Result.ok(undefined));

      const response = await controller.editExpense(id, baseDto);

      expect(response).toBeUndefined();
    });

    it('should log and throw InternalServerErrorException on PRISMA_QUERY_ERROR', async () => {
      editTransactionMock.mockResolvedValue(Result.fail({ code: Errors.PRISMA_QUERY_ERROR }));

      await expect(controller.editExpense(id, baseDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      expect(String(loggerErrorSpy.mock.calls[0]?.[0])).toContain('Error during edit expense');
    });

    it('should throw BadRequestException on domain validation error', async () => {
      editTransactionMock.mockResolvedValue(
        Result.fail({ code: Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE }),
      );

      await expect(controller.editExpense(id, baseDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('editIncome()', () => {
    const id = 'eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee';
    const baseDto: EditIncomeDto = {
      name: 'Salary',
      amount: 3500,
      dueDate: '2026-01-31T12:00:00.000Z',
      entryDate: '2026-01-01T12:00:00.000Z',
      effectivated: false,
      accountId: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
      categoryId: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
      subCategoryId: 'dddddddd-dddd-4ddd-dddd-dddddddddddd',
    };

    it('should call EditTransactionUseCase.execute with id, INCOME type, parsed dates and optional fields mapped', async () => {
      editTransactionMock.mockResolvedValue(Result.ok(undefined));

      await controller.editIncome(id, baseDto);

      expect(editTransactionMock).toHaveBeenCalledTimes(1);
      expect(editTransactionMock).toHaveBeenCalledWith({
        id,
        type: TransactionType.INCOME,
        name: 'Salary',
        amount: 3500,
        dueDate: new Date('2026-01-31T12:00:00.000Z'),
        entryDate: new Date('2026-01-01T12:00:00.000Z'),
        effectivatedDate: undefined,
        effectivated: false,
        accountId: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
        categoryId: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
        subCategoryId: 'dddddddd-dddd-4ddd-dddd-dddddddddddd',
        notes: undefined,
      });
    });

    it('should parse effectivatedDate when provided', async () => {
      editTransactionMock.mockResolvedValue(Result.ok(undefined));
      const dto: EditIncomeDto = { ...baseDto, effectivatedDate: '2026-01-05T12:00:00.000Z' };

      await controller.editIncome(id, dto);

      expect(editTransactionMock).toHaveBeenCalledWith(
        expect.objectContaining({ effectivatedDate: new Date('2026-01-05T12:00:00.000Z') }),
      );
    });

    it('should return undefined (204 No Content) on success', async () => {
      editTransactionMock.mockResolvedValue(Result.ok(undefined));

      const response = await controller.editIncome(id, baseDto);

      expect(response).toBeUndefined();
    });

    it('should log and throw InternalServerErrorException on PRISMA_QUERY_ERROR', async () => {
      editTransactionMock.mockResolvedValue(Result.fail({ code: Errors.PRISMA_QUERY_ERROR }));

      await expect(controller.editIncome(id, baseDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      expect(String(loggerErrorSpy.mock.calls[0]?.[0])).toContain('Error during edit income');
    });

    it('should throw BadRequestException on domain validation error', async () => {
      editTransactionMock.mockResolvedValue(
        Result.fail({ code: Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE }),
      );

      await expect(controller.editIncome(id, baseDto)).rejects.toThrow(BadRequestException);
    });
  });
});
