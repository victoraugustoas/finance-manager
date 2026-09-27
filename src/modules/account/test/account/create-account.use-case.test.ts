import { Result } from '@/shared/base/result';
import { RepositoryErrors } from '@/shared/errors/shared-errors';
import { AccountRepository, CreateAccount } from '@/modules/account';
import { InMemoryAccountRepository } from '../mock/in-memory-account.repository';

describe('CreateAccount', () => {
  test('should persist the account converting the decimal amount to cents', async () => {
    const repository = new InMemoryAccountRepository();
    const useCase = new CreateAccount(repository);

    const result = await useCase.execute({ name: 'Checking', openingBalance: 25.5 });

    expect(result.isOk).toBe(true);
    expect(result.instance.name).toBe('Checking');
    expect(result.instance.openingBalance.amountInCents).toBe(2550);

    const saved = await repository.findById(result.instance.id);

    expect(saved.isOk).toBe(true);
    expect(saved.instance).toBe(result.instance);
  });

  test('should fail without touching persistence when the amount is invalid', async () => {
    const repository = { create: jest.fn() } as unknown as AccountRepository;
    const useCase = new CreateAccount(repository);

    const result = await useCase.execute({ name: 'Checking', openingBalance: Number.NaN });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('MONEY_NOT_FINITE');
    expect(repository.create).not.toHaveBeenCalled();
  });

  test('should propagate persistence failures', async () => {
    const repository = {
      create: jest.fn().mockResolvedValue(Result.fail<void>(RepositoryErrors.WRITE_FAILED)),
    } as unknown as AccountRepository;
    const useCase = new CreateAccount(repository);

    const result = await useCase.execute({ name: 'Checking', openingBalance: 10 });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain(RepositoryErrors.WRITE_FAILED);
  });
});
