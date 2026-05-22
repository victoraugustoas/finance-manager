import { AccountsRepository } from '@/accounts/core/provider/accounts.repository';
import { ListAccountsUseCase } from '@/accounts/core/usecases/ListAccounts.usecase';
import { Account } from '@/accounts/core/model/Account';
import { Errors } from '@/shared/base/Errors';
import { Result } from '@/shared/base/Result';

const makeAccount = (id: string, name: string): Account =>
  Account.new({
    id,
    name,
    balance: 100,
    openingBalance: 25,
  });

describe('ListAccountsUseCase', () => {
  it('should return all accounts from repository', async () => {
    const accounts = [makeAccount('account-1', 'Checking'), makeAccount('account-2', 'Savings')];
    const accountsRepository = {
      findAll: jest.fn().mockResolvedValue(Result.ok(accounts)),
    } as unknown as AccountsRepository;

    const useCase = new ListAccountsUseCase(accountsRepository);

    const result = await useCase.execute();

    expect(result.isSuccess).toBe(true);
    expect(result.value).toBe(accounts);
    expect(accountsRepository.findAll).toHaveBeenCalledTimes(1);
  });

  it('should propagate repository failures', async () => {
    const accountsRepository = {
      findAll: jest.fn().mockResolvedValue(
        Result.fail<Account[]>({
          code: Errors.PRISMA_QUERY_ERROR,
          cls: 'test',
        }),
      ),
    } as unknown as AccountsRepository;

    const useCase = new ListAccountsUseCase(accountsRepository);

    const result = await useCase.execute();

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
    expect(accountsRepository.findAll).toHaveBeenCalledTimes(1);
  });
});
