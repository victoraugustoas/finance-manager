import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TransactionsController } from '@/transactions/infra/controllers/Transactions.controller';
import { RegisterExpenseUseCase } from '@/transactions/core/usecases/RegisterExpense.usecase';
import { RegisterIncomeUseCase } from '@/transactions/core/usecases/RegisterIncome.usecase';
import { RegisterExpenseDto } from '@/transactions/infra/dtos/RegisterExpense.dto';
import { RegisterIncomeDto } from '@/transactions/infra/dtos/RegisterIncome.dto';
import { Expense } from '@/transactions/core/model/Expense';
import { Income } from '@/transactions/core/model/Income';
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
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    registerExpenseMock = jest.fn();
    registerIncomeMock = jest.fn();
    controller = new TransactionsController(
      { execute: registerExpenseMock } as unknown as RegisterExpenseUseCase,
      { execute: registerIncomeMock } as unknown as RegisterIncomeUseCase,
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
});
