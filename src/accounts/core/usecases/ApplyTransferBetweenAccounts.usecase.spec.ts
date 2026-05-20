import { Result } from '@/shared/base/Result';
import { Errors } from '@/shared/base/Errors';
import { AccountsRepository } from '@/accounts/core/provider/accounts.repository';
import { Account } from '@/accounts/core/model/Account';
import { ApplyTransferBetweenAccountsUseCase } from './ApplyTransferBetweenAccounts.usecase';

const makeAccount = (balance: number) => Account.new({ name: 'Test', balance, openingBalance: 0 });

const makeRepo = (origin: Account, destination: Account) =>
  ({
    findById: jest
      .fn()
      .mockResolvedValueOnce(Result.ok(origin))
      .mockResolvedValueOnce(Result.ok(destination)),
    save: jest.fn().mockResolvedValue(Result.ok(undefined)),
  }) as unknown as AccountsRepository;

describe('ApplyTransferBetweenAccountsUseCase', () => {
  describe('execute()', () => {
    it('should apply the transfer and return success when effectivated', async () => {
      const origin = makeAccount(500);
      const destination = makeAccount(100);
      const repo = makeRepo(origin, destination);
      const useCase = new ApplyTransferBetweenAccountsUseCase(repo);

      const result = await useCase.execute({
        accountIdOrigin: 'origin-id',
        accountIdDestination: 'destination-id',
        amount: 200,
        effectivated: true,
      });

      expect(result.isSuccess).toBe(true);
      expect(origin.balance.amount).toBe(300);
      expect(destination.balance.amount).toBe(300);
    });

    it('should save both accounts but not change balances when not effectivated', async () => {
      const origin = makeAccount(500);
      const destination = makeAccount(100);
      const repo = makeRepo(origin, destination);
      const useCase = new ApplyTransferBetweenAccountsUseCase(repo);

      const result = await useCase.execute({
        accountIdOrigin: 'origin-id',
        accountIdDestination: 'destination-id',
        amount: 200,
        effectivated: false,
      });

      expect(result.isSuccess).toBe(true);
      expect(origin.balance.amount).toBe(500);
      expect(destination.balance.amount).toBe(100);
      expect(repo.save).toHaveBeenCalledTimes(2);
    });

    it('should save both accounts after applying the transfer', async () => {
      const origin = makeAccount(500);
      const destination = makeAccount(100);
      const repo = makeRepo(origin, destination);
      const useCase = new ApplyTransferBetweenAccountsUseCase(repo);

      await useCase.execute({
        accountIdOrigin: 'origin-id',
        accountIdDestination: 'destination-id',
        amount: 200,
        effectivated: true,
      });

      expect(repo.save).toHaveBeenCalledTimes(2);
      expect(repo.save).toHaveBeenCalledWith(origin);
      expect(repo.save).toHaveBeenCalledWith(destination);
    });

    it('should fail and not save when amount is invalid', async () => {
      const origin = makeAccount(500);
      const destination = makeAccount(100);
      const repo = makeRepo(origin, destination);
      const useCase = new ApplyTransferBetweenAccountsUseCase(repo);

      const result = await useCase.execute({
        accountIdOrigin: 'origin-id',
        accountIdDestination: 'destination-id',
        amount: NaN,
        effectivated: true,
      });

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.MONEY_NOT_FINITE);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('should fail and not save when origin account is not found', async () => {
      const repo = {
        findById: jest
          .fn()
          .mockResolvedValueOnce(Result.fail({ code: Errors.PRISMA_QUERY_ERROR, cls: 'test' }))
          .mockResolvedValueOnce(Result.ok(makeAccount(100))),
        save: jest.fn(),
      } as unknown as AccountsRepository;
      const useCase = new ApplyTransferBetweenAccountsUseCase(repo);

      const result = await useCase.execute({
        accountIdOrigin: 'not-found',
        accountIdDestination: 'destination-id',
        amount: 100,
        effectivated: true,
      });

      expect(result.isFailure).toBe(true);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('should fail and not save when destination account is not found', async () => {
      const repo = {
        findById: jest
          .fn()
          .mockResolvedValueOnce(Result.ok(makeAccount(500)))
          .mockResolvedValueOnce(Result.fail({ code: Errors.PRISMA_QUERY_ERROR, cls: 'test' })),
        save: jest.fn(),
      } as unknown as AccountsRepository;
      const useCase = new ApplyTransferBetweenAccountsUseCase(repo);

      const result = await useCase.execute({
        accountIdOrigin: 'origin-id',
        accountIdDestination: 'not-found',
        amount: 100,
        effectivated: true,
      });

      expect(result.isFailure).toBe(true);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('should propagate save failure', async () => {
      const origin = makeAccount(500);
      const destination = makeAccount(100);
      const repo = {
        findById: jest
          .fn()
          .mockResolvedValueOnce(Result.ok(origin))
          .mockResolvedValueOnce(Result.ok(destination)),
        save: jest
          .fn()
          .mockResolvedValue(Result.fail({ code: Errors.PRISMA_INSERT_ERROR, cls: 'test' })),
      } as unknown as AccountsRepository;
      const useCase = new ApplyTransferBetweenAccountsUseCase(repo);

      const result = await useCase.execute({
        accountIdOrigin: 'origin-id',
        accountIdDestination: 'destination-id',
        amount: 200,
        effectivated: true,
      });

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.PRISMA_INSERT_ERROR);
    });
  });
});
