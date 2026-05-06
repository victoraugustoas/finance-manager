import { Account } from '@/accounts/core/model/Account';
import { PrismaAccountsRepository } from '@/accounts/infra/db/PrismaAccounts.repository';
import { Errors } from '@/shared/base/Errors';
import { PrismaService } from '@/shared/infra/PrismaService';

describe('PrismaAccountsRepository', () => {
  const accountId = '11111111-1111-1111-1111-111111111111';

  const makeAccount = (): Account => {
    const result = Account.create({
      id: accountId,
      name: 'Checking',
      balance: 100.5,
      openingBalance: 25,
    });
    if (result.isFailure) {
      throw new Error('Expected Account.create to succeed in test setup');
    }
    return result.value;
  };

  it('should call prisma with cents and return ok when create succeeds', async () => {
    const create = jest.fn().mockResolvedValue(undefined);
    const prisma = {
      account: { create },
    } as unknown as PrismaService;

    const repository = new PrismaAccountsRepository(prisma);
    const account = makeAccount();

    const result = await repository.create(account);

    expect(result.isSuccess).toBe(true);
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      data: {
        id: accountId,
        name: 'Checking',
        balance: 10050,
        openingBalance: 2500,
      },
    });
  });

  it('should return PRISMA_INSERT_ERROR when prisma create throws', async () => {
    const prismaError = new Error('Unique constraint failed');
    const create = jest.fn().mockRejectedValue(prismaError);
    const prisma = {
      account: { create },
    } as unknown as PrismaService;

    const repository = new PrismaAccountsRepository(prisma);
    const account = makeAccount();

    const result = await repository.create(account);

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_INSERT_ERROR);
    expect(result.errors[0].cls).toBe('PrismaAccountsRepository');
    expect(result.errors[0].data).toEqual({ error: String(prismaError) });
  });
});
