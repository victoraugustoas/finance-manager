import { Result } from '@/shared/base/Result';
import { Errors } from '@/shared/base/Errors';
import { AccountsRepository } from '@/accounts/core/provider/accounts.repository';
import { Account } from '@/accounts/core/model/Account';
import { UpdateAccountBalance } from './UpdateAccountBalance';
import { TransactionType } from '@/shared/enums/TransactionType';

const makeAccount = (balance = 100) =>
  Account.create({ name: 'Test', balance, openingBalance: 0 }).value;

const makeRepo = (account: Account) =>
  ({
    findById: jest.fn().mockResolvedValue(Result.ok(account)),
    save: jest.fn().mockResolvedValue(Result.ok(undefined)),
  }) as unknown as AccountsRepository;

describe('UpdateAccountBalance', () => {
  describe('NEW_TRANSACTION', () => {
    it('should subtract balance on effectivated EXPENSE', async () => {
      const account = makeAccount(100);
      const repo = makeRepo(account);
      const useCase = new UpdateAccountBalance(repo);

      const result = await useCase.execute({
        updatedBy: 'NEW_TRANSACTION',
        accountId: 'acc-1',
        value: 30,
        type: TransactionType.EXPENSE,
        effectivated: true,
      });

      expect(result.isSuccess).toBe(true);
      expect(account.balance.amount).toBe(70);
      expect(repo.save).toHaveBeenCalledWith(account);
    });

    it('should add to balance on effectivated INCOME', async () => {
      const account = makeAccount(100);
      const repo = makeRepo(account);
      const useCase = new UpdateAccountBalance(repo);

      const result = await useCase.execute({
        updatedBy: 'NEW_TRANSACTION',
        accountId: 'acc-1',
        value: 50,
        type: TransactionType.INCOME,
        effectivated: true,
      });

      expect(result.isSuccess).toBe(true);
      expect(account.balance.amount).toBe(150);
      expect(repo.save).toHaveBeenCalledWith(account);
    });

    it('should not change balance when not effectivated', async () => {
      const account = makeAccount(100);
      const repo = makeRepo(account);
      const useCase = new UpdateAccountBalance(repo);

      await useCase.execute({
        updatedBy: 'NEW_TRANSACTION',
        accountId: 'acc-1',
        value: 30,
        type: TransactionType.EXPENSE,
        effectivated: false,
      });

      expect(account.balance.amount).toBe(100);
    });

    it('should fail without calling save when value is invalid', async () => {
      const account = makeAccount(100);
      const repo = makeRepo(account);
      const useCase = new UpdateAccountBalance(repo);

      const result = await useCase.execute({
        updatedBy: 'NEW_TRANSACTION',
        accountId: 'acc-1',
        value: NaN,
        type: TransactionType.EXPENSE,
        effectivated: true,
      });

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.MONEY_NOT_FINITE);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('should fail when account is not found', async () => {
      const repo = {
        findById: jest
          .fn()
          .mockResolvedValue(Result.fail({ code: Errors.PRISMA_QUERY_ERROR, cls: 'test' })),
        save: jest.fn(),
      } as unknown as AccountsRepository;
      const useCase = new UpdateAccountBalance(repo);

      const result = await useCase.execute({
        updatedBy: 'NEW_TRANSACTION',
        accountId: 'not-found',
        value: 10,
        type: TransactionType.INCOME,
        effectivated: true,
      });

      expect(result.isFailure).toBe(true);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('should propagate save failure', async () => {
      const account = makeAccount(100);
      const repo = {
        findById: jest.fn().mockResolvedValue(Result.ok(account)),
        save: jest
          .fn()
          .mockResolvedValue(Result.fail({ code: Errors.PRISMA_INSERT_ERROR, cls: 'test' })),
      } as unknown as AccountsRepository;
      const useCase = new UpdateAccountBalance(repo);

      const result = await useCase.execute({
        updatedBy: 'NEW_TRANSACTION',
        accountId: 'acc-1',
        value: 10,
        type: TransactionType.EXPENSE,
        effectivated: true,
      });

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.PRISMA_INSERT_ERROR);
    });
  });

  describe('EDIT', () => {
    it('should reverse old EXPENSE and apply new when going from effectivated to not effectivated', async () => {
      // balance -50, expense was 20 (effectivated → not effectivated), changed to 10 → -50 + 20 - 10 = -40
      const account = makeAccount(-50);
      const repo = makeRepo(account);
      const useCase = new UpdateAccountBalance(repo);

      const result = await useCase.execute({
        updatedBy: 'EDIT',
        accountId: 'acc-1',
        oldValue: 20,
        newValue: 10,
        type: TransactionType.EXPENSE,
        oldEffectivated: true,
        newEffectivated: false,
      });

      expect(result.isSuccess).toBe(true);
      expect(account.balance.amount).toBe(-40);
      expect(repo.save).toHaveBeenCalledWith(account);
    });

    it('should reverse old INCOME and apply new when going from effectivated to not effectivated', async () => {
      // balance 100, income was 40 (effectivated → not effectivated), changed to 60 → 100 - 40 + 60 = 120
      const account = makeAccount(100);
      const repo = makeRepo(account);
      const useCase = new UpdateAccountBalance(repo);

      await useCase.execute({
        updatedBy: 'EDIT',
        accountId: 'acc-1',
        oldValue: 40,
        newValue: 60,
        type: TransactionType.INCOME,
        oldEffectivated: true,
        newEffectivated: false,
      });

      expect(account.balance.amount).toBe(120);
    });

    it('should only apply new EXPENSE when going from not effectivated to effectivated', async () => {
      // balance 100, expense was 20 (not effectivated → effectivated), changed to 30 → 100 - 30 = 70
      const account = makeAccount(100);
      const repo = makeRepo(account);
      const useCase = new UpdateAccountBalance(repo);

      await useCase.execute({
        updatedBy: 'EDIT',
        accountId: 'acc-1',
        oldValue: 20,
        newValue: 30,
        type: TransactionType.EXPENSE,
        oldEffectivated: false,
        newEffectivated: true,
      });

      expect(account.balance.amount).toBe(70);
    });

    it('should fail without calling save when a Money value is invalid', async () => {
      const account = makeAccount(100);
      const repo = makeRepo(account);
      const useCase = new UpdateAccountBalance(repo);

      const result = await useCase.execute({
        updatedBy: 'EDIT',
        accountId: 'acc-1',
        oldValue: NaN,
        newValue: 10,
        type: TransactionType.EXPENSE,
        oldEffectivated: true,
        newEffectivated: true,
      });

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.MONEY_NOT_FINITE);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('should fail when account is not found', async () => {
      const repo = {
        findById: jest
          .fn()
          .mockResolvedValue(Result.fail({ code: Errors.PRISMA_QUERY_ERROR, cls: 'test' })),
        save: jest.fn(),
      } as unknown as AccountsRepository;
      const useCase = new UpdateAccountBalance(repo);

      const result = await useCase.execute({
        updatedBy: 'EDIT',
        accountId: 'not-found',
        oldValue: 10,
        newValue: 20,
        type: TransactionType.EXPENSE,
        oldEffectivated: true,
        newEffectivated: true,
      });

      expect(result.isFailure).toBe(true);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });
});
