import { Result } from '@/shared/base/Result';
import { Errors } from '@/shared/base/Errors';
import { AccountsRepository } from '@/accounts/core/provider/accounts.repository';
import { Account } from '@/accounts/core/model/Account';
import { UpdateAccountBalance } from './UpdateAccountBalance';

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
        type: 'EXPENSE',
        effectivated: true,
      });

      expect(result.isSuccess).toBe(true);
      expect(account.balance.amount).toBe(70);
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
        type: 'EXPENSE',
        effectivated: false,
      });

      expect(account.balance.amount).toBe(100);
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
        type: 'INCOME',
        effectivated: true,
      });

      expect(result.isFailure).toBe(true);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('EDIT', () => {
    it('should reverse old amount and apply new amount for EXPENSE', async () => {
      // balance -50, expense was 20, changed to 10 → -50 + 20 - 10 = -40
      const account = makeAccount(-50);
      const repo = makeRepo(account);
      const useCase = new UpdateAccountBalance(repo);

      const result = await useCase.execute({
        updatedBy: 'EDIT',
        accountId: 'acc-1',
        oldValue: 20,
        newValue: 10,
        type: 'EXPENSE',
        effectivated: true,
      });

      expect(result.isSuccess).toBe(true);
      expect(account.balance.amount).toBe(-40);
      expect(repo.save).toHaveBeenCalledWith(account);
    });

    it('should reverse old amount and apply new amount for INCOME', async () => {
      // balance 100, income was 40, changed to 60 → 100 - 40 + 60 = 120
      const account = makeAccount(100);
      const repo = makeRepo(account);
      const useCase = new UpdateAccountBalance(repo);

      await useCase.execute({
        updatedBy: 'EDIT',
        accountId: 'acc-1',
        oldValue: 40,
        newValue: 60,
        type: 'INCOME',
        effectivated: true,
      });

      expect(account.balance.amount).toBe(120);
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
        type: 'EXPENSE',
        effectivated: true,
      });

      expect(result.isFailure).toBe(true);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });
});
