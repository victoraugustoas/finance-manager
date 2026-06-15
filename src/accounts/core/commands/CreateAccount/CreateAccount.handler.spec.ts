import { Errors } from '@/shared/base/Errors';
import { Result } from '@/shared/base/Result';
import { AccountsRepository } from '@/accounts/core/ports/repositories/Accounts.repository';
import { CreateAccountHandler } from '@/accounts/core/commands/CreateAccount/CreateAccount.handler';

describe('CreateAccountHandler', () => {
  const baseParams = {
    name: 'Checking',
    openingBalance: 25,
  };

  it('should fail when domain validation fails without calling persistence', async () => {
    const accountsRepository = {
      save: jest.fn(),
    } as unknown as AccountsRepository;

    const handler = new CreateAccountHandler(accountsRepository);

    const result = await handler.handle({
      ...baseParams,
      openingBalance: NaN,
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.MONEY_NOT_FINITE);
    expect(accountsRepository.save).not.toHaveBeenCalled();
  });

  it('should fail when persistence fails', async () => {
    const accountsRepository = {
      save: jest.fn().mockResolvedValue(
        Result.fail<void>({
          code: Errors.PRISMA_INSERT_ERROR,
          cls: 'test',
        }),
      ),
    } as unknown as AccountsRepository;

    const handler = new CreateAccountHandler(accountsRepository);

    const result = await handler.handle(baseParams);

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_INSERT_ERROR);
    expect(accountsRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should persist and return the created account when validation passes', async () => {
    const accountsRepository = {
      save: jest.fn().mockResolvedValue(Result.ok(undefined)),
    } as unknown as AccountsRepository;

    const handler = new CreateAccountHandler(accountsRepository);

    const result = await handler.handle(baseParams);

    expect(result.isSuccess).toBe(true);
    expect(result.value.id).toEqual(expect.any(String));
    expect(result.value.name).toBe(baseParams.name);
    expect(result.value.openingBalance.amount).toBe(baseParams.openingBalance);
    expect(accountsRepository.save).toHaveBeenCalledTimes(1);
    expect(accountsRepository.save).toHaveBeenCalledWith(result.value);
  });
});
