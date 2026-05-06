import { Errors } from '@/shared/base/Errors';
import { Result } from '@/shared/base/Result';
import { AccountsRepository } from '@/accounts/core/provider/accounts.repository';
import { CreateAccountUseCase } from '@/accounts/core/usecases/CreateAccount.usecase';

describe('CreateAccountUseCase', () => {
  const baseParams = {
    name: 'Checking',
    balance: 100.5,
    openingBalance: 25,
  };

  it('should fail when domain validation fails without calling persistence', async () => {
    const accountsRepository = {
      create: jest.fn(),
    } as unknown as AccountsRepository;

    const useCase = new CreateAccountUseCase(accountsRepository);

    const result = await useCase.execute({
      ...baseParams,
      balance: NaN,
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.MONEY_NOT_FINITE);
    expect(accountsRepository.create).not.toHaveBeenCalled();
  });

  it('should fail when persistence fails', async () => {
    const accountsRepository = {
      create: jest.fn().mockResolvedValue(
        Result.fail<void>({
          code: Errors.PRISMA_INSERT_ERROR,
          cls: 'test',
        }),
      ),
    } as unknown as AccountsRepository;

    const useCase = new CreateAccountUseCase(accountsRepository);

    const result = await useCase.execute(baseParams);

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_INSERT_ERROR);
    expect(accountsRepository.create).toHaveBeenCalledTimes(1);
  });

  it('should persist and return the created account when validation passes', async () => {
    const accountsRepository = {
      create: jest.fn().mockResolvedValue(Result.ok(undefined)),
    } as unknown as AccountsRepository;

    const useCase = new CreateAccountUseCase(accountsRepository);

    const result = await useCase.execute(baseParams);

    expect(result.isSuccess).toBe(true);
    expect(result.value.id).toEqual(expect.any(String));
    expect(result.value.name).toBe(baseParams.name);
    expect(result.value.balance.amount).toBe(baseParams.balance);
    expect(result.value.openingBalance.amount).toBe(baseParams.openingBalance);
    expect(accountsRepository.create).toHaveBeenCalledTimes(1);
    expect(accountsRepository.create).toHaveBeenCalledWith(result.value);
  });
});
