import { Account } from '@/accounts/core/model/Account';
import { PrismaAccountsRepository } from '@/accounts/infra/db/PrismaAccounts.repository';
import { Errors } from '@/shared/base/Errors';
import { PrismaService } from '@/shared/infra/PrismaService';

const accountId = '11111111-1111-1111-1111-111111111111';

const makeAccount = (): Account => {
  const result = Account.create({
    id: accountId,
    name: 'Checking',
    balance: 100.5,
    openingBalance: 25,
  });
  if (result.isFailure) throw new Error('Expected Account.create to succeed in test setup');
  return result.value;
};

describe('PrismaAccountsRepository', () => {
  let upsert: jest.Mock;
  let findUnique: jest.Mock;
  let findMany: jest.Mock;
  let prisma: PrismaService;
  let repository: PrismaAccountsRepository;

  beforeEach(() => {
    upsert = jest.fn().mockResolvedValue(undefined);
    findUnique = jest.fn();
    findMany = jest.fn();

    const tx = {
      account: { upsert },
      outboxEvent: { createMany: jest.fn().mockResolvedValue(undefined) },
    };

    prisma = {
      $transaction: jest.fn().mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn(tx)),
      account: { findUnique, findMany },
    } as unknown as PrismaService;

    repository = new PrismaAccountsRepository(prisma);
  });

  describe('save()', () => {
    it('should return ok when upsert succeeds', async () => {
      const result = await repository.save(makeAccount());

      expect(result.isSuccess).toBe(true);
    });

    it('should call upsert with amounts in cents', async () => {
      const account = makeAccount();

      await repository.save(account);

      expect(upsert).toHaveBeenCalledTimes(1);
      expect(upsert).toHaveBeenCalledWith({
        where: { id: accountId },
        create: {
          id: accountId,
          name: 'Checking',
          balance: 10050,
          openingBalance: 2500,
        },
        update: {
          name: 'Checking',
          balance: 10050,
        },
      });
    });

    it('should return PRISMA_INSERT_ERROR when transaction throws', async () => {
      const dbError = new Error('Unique constraint failed');
      (prisma.$transaction as jest.Mock).mockRejectedValue(dbError);

      const result = await repository.save(makeAccount());

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.PRISMA_INSERT_ERROR);
      expect(result.errors[0].cls).toBe('PrismaAccountsRepository');
      expect(result.errors[0].data).toEqual({ error: String(dbError) });
    });
  });

  describe('findById()', () => {
    it('should return the reconstructed account when found', async () => {
      findUnique.mockResolvedValue({
        id: accountId,
        name: 'Checking',
        balance: 10050,
        openingBalance: 2500,
      });

      const result = await repository.findById(accountId);

      expect(result.isSuccess).toBe(true);
      expect(result.value.id).toBe(accountId);
      expect(result.value.name).toBe('Checking');
      expect(result.value.balance.amountInCents).toBe(10050);
      expect(result.value.openingBalance.amountInCents).toBe(2500);
    });

    it('should call findUnique with the given id', async () => {
      findUnique.mockResolvedValue({
        id: accountId,
        name: 'Checking',
        balance: 10050,
        openingBalance: 2500,
      });

      await repository.findById(accountId);

      expect(findUnique).toHaveBeenCalledWith({ where: { id: accountId } });
    });

    it('should return PRISMA_QUERY_ERROR when account is not found', async () => {
      findUnique.mockResolvedValue(null);

      const result = await repository.findById(accountId);

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
    });

    it('should return PRISMA_QUERY_ERROR when findUnique throws', async () => {
      findUnique.mockRejectedValue(new Error('Connection lost'));

      const result = await repository.findById(accountId);

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
    });
  });

  describe('findAll()', () => {
    it('should return all reconstructed accounts', async () => {
      findMany.mockResolvedValue([
        {
          id: accountId,
          name: 'Checking',
          balance: 10050,
          openingBalance: 2500,
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Savings',
          balance: 80000,
          openingBalance: 15000,
        },
      ]);

      const result = await repository.findAll();

      expect(result.isSuccess).toBe(true);
      expect(result.value).toHaveLength(2);
      expect(result.value[0].id).toBe(accountId);
      expect(result.value[0].name).toBe('Checking');
      expect(result.value[0].balance.amountInCents).toBe(10050);
      expect(result.value[0].openingBalance.amountInCents).toBe(2500);
      expect(result.value[1].id).toBe('22222222-2222-2222-2222-222222222222');
      expect(result.value[1].name).toBe('Savings');
      expect(result.value[1].balance.amountInCents).toBe(80000);
      expect(result.value[1].openingBalance.amountInCents).toBe(15000);
    });

    it('should call findMany without filters', async () => {
      findMany.mockResolvedValue([]);

      await repository.findAll();

      expect(findMany).toHaveBeenCalledWith();
    });

    it('should return PRISMA_QUERY_ERROR when findMany throws', async () => {
      findMany.mockRejectedValue(new Error('Connection lost'));

      const result = await repository.findAll();

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
    });
  });
});
