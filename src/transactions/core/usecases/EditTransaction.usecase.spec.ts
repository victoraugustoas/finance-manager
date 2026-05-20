import { Errors } from '@/shared/base/Errors';
import { Result } from '@/shared/base/Result';
import { Income } from '@/transactions/core/model/Income';
import { Expense } from '@/transactions/core/model/Expense';
import { TransactionProps } from '@/transactions/core/model/Transaction';
import { TransactionType } from '@/shared/enums/TransactionType';
import { TransactionsRepository } from '@/transactions/core/provider/Transactions.repository';
import { TransactionAccountQuery } from '../provider/TransactionAccount.query';
import { TransactionCategoryHierarchyQuery } from '../provider/TransactionCategoryHierarchy.query';
import { EditTransactionUseCase } from './EditTransaction.usecase';

describe('EditTransactionUseCase', () => {
  const entryDate = new Date('2026-01-10T12:00:00.000Z');
  const dueDate = new Date('2026-01-15T12:00:00.000Z');

  const baseIncomeParams: Required<Pick<TransactionProps, 'id'>> & TransactionProps = {
    id: 'tx-income-1',
    name: 'Salary',
    amount: 5000,
    dueDate,
    entryDate,
    effectivated: false,
    accountId: 'acc-1',
    categoryId: 'cat-1',
    subCategoryId: 'sub-1',
    type: TransactionType.INCOME,
  };

  const baseExpenseParams: Required<Pick<TransactionProps, 'id'>> & TransactionProps = {
    id: 'tx-expense-1',
    name: 'Groceries',
    amount: 100,
    dueDate,
    entryDate,
    effectivated: false,
    accountId: 'acc-1',
    categoryId: 'cat-2',
    subCategoryId: 'sub-2',
    type: TransactionType.EXPENSE,
  };

  function makeIncome(overrides: Partial<TransactionProps> = {}): Income {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { type: _type, ...props } = { ...baseIncomeParams, ...overrides };
    return Income.create(props).value;
  }

  function makeExpense(overrides: Partial<TransactionProps> = {}): Expense {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { type: _type, ...props } = { ...baseExpenseParams, ...overrides };
    return Expense.create(props).value;
  }

  let accounts: TransactionAccountQuery;
  let categoryHierarchy: TransactionCategoryHierarchyQuery;
  let transactionsRepository: TransactionsRepository;

  beforeEach(() => {
    accounts = {
      existsById: jest.fn().mockResolvedValue(Result.ok(undefined)),
    } as unknown as TransactionAccountQuery;

    categoryHierarchy = {
      ensureIncomeHierarchy: jest.fn().mockResolvedValue(Result.ok(undefined)),
      ensureExpenseHierarchy: jest.fn().mockResolvedValue(Result.ok(undefined)),
    } as unknown as TransactionCategoryHierarchyQuery;

    transactionsRepository = {
      findIncomeById: jest.fn(),
      findExpenseById: jest.fn(),
      saveIncome: jest.fn().mockResolvedValue(Result.ok(undefined)),
      saveExpense: jest.fn().mockResolvedValue(Result.ok(undefined)),
    } as unknown as TransactionsRepository;
  });

  describe('INCOME', () => {
    it('should fail when income is not found without calling persistence', async () => {
      (transactionsRepository.findIncomeById as jest.Mock).mockResolvedValue(
        Result.fail({ code: Errors.PRISMA_QUERY_ERROR, cls: 'test' }),
      );

      const useCase = new EditTransactionUseCase(
        transactionsRepository,
        accounts,
        categoryHierarchy,
      );

      const result = await useCase.execute(baseIncomeParams);

      expect(result.isFailure).toBe(true);
      expect(transactionsRepository.saveIncome).not.toHaveBeenCalled();
    });

    it('should fail when account does not exist without persisting', async () => {
      (transactionsRepository.findIncomeById as jest.Mock).mockResolvedValue(
        Result.ok(makeIncome()),
      );
      (accounts.existsById as jest.Mock).mockResolvedValue(
        Result.fail({ code: Errors.REFERENCE_ACCOUNT_NOT_FOUND, cls: 'test' }),
      );

      const useCase = new EditTransactionUseCase(
        transactionsRepository,
        accounts,
        categoryHierarchy,
      );

      const result = await useCase.execute(baseIncomeParams);

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.REFERENCE_ACCOUNT_NOT_FOUND);
      expect(transactionsRepository.saveIncome).not.toHaveBeenCalled();
    });

    it('should fail when income category hierarchy validation fails without persisting', async () => {
      (transactionsRepository.findIncomeById as jest.Mock).mockResolvedValue(
        Result.ok(makeIncome()),
      );
      (categoryHierarchy.ensureIncomeHierarchy as jest.Mock).mockResolvedValue(
        Result.fail({ code: Errors.REFERENCE_SUBCATEGORY_NOT_IN_CATEGORY, cls: 'test' }),
      );

      const useCase = new EditTransactionUseCase(
        transactionsRepository,
        accounts,
        categoryHierarchy,
      );

      const result = await useCase.execute(baseIncomeParams);

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.REFERENCE_SUBCATEGORY_NOT_IN_CATEGORY);
      expect(transactionsRepository.saveIncome).not.toHaveBeenCalled();
    });

    it('should fail when income entity edit fails without persisting', async () => {
      (transactionsRepository.findIncomeById as jest.Mock).mockResolvedValue(
        Result.ok(makeIncome()),
      );

      const useCase = new EditTransactionUseCase(
        transactionsRepository,
        accounts,
        categoryHierarchy,
      );

      const result = await useCase.execute({ ...baseIncomeParams, amount: 0 });

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE);
      expect(transactionsRepository.saveIncome).not.toHaveBeenCalled();
    });

    it('should call saveIncome when all validations pass', async () => {
      (transactionsRepository.findIncomeById as jest.Mock).mockResolvedValue(
        Result.ok(makeIncome()),
      );

      const useCase = new EditTransactionUseCase(
        transactionsRepository,
        accounts,
        categoryHierarchy,
      );

      const result = await useCase.execute(baseIncomeParams);

      expect(result.isSuccess).toBe(true);
      expect(transactionsRepository.saveIncome).toHaveBeenCalledTimes(1);
      expect(transactionsRepository.saveExpense).not.toHaveBeenCalled();
    });

    it('should call ensureIncomeHierarchy with the correct category ids', async () => {
      (transactionsRepository.findIncomeById as jest.Mock).mockResolvedValue(
        Result.ok(makeIncome()),
      );

      const useCase = new EditTransactionUseCase(
        transactionsRepository,
        accounts,
        categoryHierarchy,
      );

      await useCase.execute(baseIncomeParams);

      expect(categoryHierarchy.ensureIncomeHierarchy).toHaveBeenCalledWith(
        baseIncomeParams.categoryId,
        baseIncomeParams.subCategoryId,
      );
      expect(categoryHierarchy.ensureExpenseHierarchy).not.toHaveBeenCalled();
    });

    it('should propagate save failure', async () => {
      (transactionsRepository.findIncomeById as jest.Mock).mockResolvedValue(
        Result.ok(makeIncome()),
      );
      (transactionsRepository.saveIncome as jest.Mock).mockResolvedValue(
        Result.fail({ code: Errors.PRISMA_INSERT_ERROR, cls: 'test' }),
      );

      const useCase = new EditTransactionUseCase(
        transactionsRepository,
        accounts,
        categoryHierarchy,
      );

      const result = await useCase.execute(baseIncomeParams);

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.PRISMA_INSERT_ERROR);
    });
  });

  describe('EXPENSE', () => {
    it('should fail when expense is not found without calling persistence', async () => {
      (transactionsRepository.findExpenseById as jest.Mock).mockResolvedValue(
        Result.fail({ code: Errors.PRISMA_QUERY_ERROR, cls: 'test' }),
      );

      const useCase = new EditTransactionUseCase(
        transactionsRepository,
        accounts,
        categoryHierarchy,
      );

      const result = await useCase.execute(baseExpenseParams);

      expect(result.isFailure).toBe(true);
      expect(transactionsRepository.saveExpense).not.toHaveBeenCalled();
    });

    it('should fail when account does not exist without persisting', async () => {
      (transactionsRepository.findExpenseById as jest.Mock).mockResolvedValue(
        Result.ok(makeExpense()),
      );
      (accounts.existsById as jest.Mock).mockResolvedValue(
        Result.fail({ code: Errors.REFERENCE_ACCOUNT_NOT_FOUND, cls: 'test' }),
      );

      const useCase = new EditTransactionUseCase(
        transactionsRepository,
        accounts,
        categoryHierarchy,
      );

      const result = await useCase.execute(baseExpenseParams);

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.REFERENCE_ACCOUNT_NOT_FOUND);
      expect(transactionsRepository.saveExpense).not.toHaveBeenCalled();
    });

    it('should fail when expense category hierarchy validation fails without persisting', async () => {
      (transactionsRepository.findExpenseById as jest.Mock).mockResolvedValue(
        Result.ok(makeExpense()),
      );
      (categoryHierarchy.ensureExpenseHierarchy as jest.Mock).mockResolvedValue(
        Result.fail({ code: Errors.REFERENCE_SUBCATEGORY_NOT_IN_CATEGORY, cls: 'test' }),
      );

      const useCase = new EditTransactionUseCase(
        transactionsRepository,
        accounts,
        categoryHierarchy,
      );

      const result = await useCase.execute(baseExpenseParams);

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.REFERENCE_SUBCATEGORY_NOT_IN_CATEGORY);
      expect(transactionsRepository.saveExpense).not.toHaveBeenCalled();
    });

    it('should fail when expense entity edit fails without persisting', async () => {
      (transactionsRepository.findExpenseById as jest.Mock).mockResolvedValue(
        Result.ok(makeExpense()),
      );

      const useCase = new EditTransactionUseCase(
        transactionsRepository,
        accounts,
        categoryHierarchy,
      );

      const result = await useCase.execute({ ...baseExpenseParams, amount: 0 });

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.AMOUNT_NOT_ZERO_OR_NEGATIVE);
      expect(transactionsRepository.saveExpense).not.toHaveBeenCalled();
    });

    it('should call saveExpense when all validations pass', async () => {
      (transactionsRepository.findExpenseById as jest.Mock).mockResolvedValue(
        Result.ok(makeExpense()),
      );

      const useCase = new EditTransactionUseCase(
        transactionsRepository,
        accounts,
        categoryHierarchy,
      );

      const result = await useCase.execute(baseExpenseParams);

      expect(result.isSuccess).toBe(true);
      expect(transactionsRepository.saveExpense).toHaveBeenCalledTimes(1);
      expect(transactionsRepository.saveIncome).not.toHaveBeenCalled();
    });

    it('should call ensureExpenseHierarchy with the correct category ids', async () => {
      (transactionsRepository.findExpenseById as jest.Mock).mockResolvedValue(
        Result.ok(makeExpense()),
      );

      const useCase = new EditTransactionUseCase(
        transactionsRepository,
        accounts,
        categoryHierarchy,
      );

      await useCase.execute(baseExpenseParams);

      expect(categoryHierarchy.ensureExpenseHierarchy).toHaveBeenCalledWith(
        baseExpenseParams.categoryId,
        baseExpenseParams.subCategoryId,
      );
      expect(categoryHierarchy.ensureIncomeHierarchy).not.toHaveBeenCalled();
    });

    it('should propagate save failure', async () => {
      (transactionsRepository.findExpenseById as jest.Mock).mockResolvedValue(
        Result.ok(makeExpense()),
      );
      (transactionsRepository.saveExpense as jest.Mock).mockResolvedValue(
        Result.fail({ code: Errors.PRISMA_INSERT_ERROR, cls: 'test' }),
      );

      const useCase = new EditTransactionUseCase(
        transactionsRepository,
        accounts,
        categoryHierarchy,
      );

      const result = await useCase.execute(baseExpenseParams);

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.PRISMA_INSERT_ERROR);
    });
  });
});
