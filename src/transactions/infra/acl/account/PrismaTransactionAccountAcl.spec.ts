import { PrismaTransactionAccountAcl } from '@/transactions/infra/acl/account/PrismaTransactionAccountAcl';
import { Errors } from '@/shared/base/Errors';
import { PrismaService } from '@/shared/infra/PrismaService';

describe('PrismaTransactionAccountAcl', () => {
  const accountId = '11111111-1111-1111-1111-111111111111';

  let findUnique: jest.Mock;
  let prisma: PrismaService;
  let acl: PrismaTransactionAccountAcl;

  beforeEach(() => {
    findUnique = jest.fn();
    prisma = { account: { findUnique } } as unknown as PrismaService;
    acl = new PrismaTransactionAccountAcl(prisma);
  });

  describe('existsById()', () => {
    it('should return ok when the account exists', async () => {
      findUnique.mockResolvedValue({ id: accountId });

      const result = await acl.existsById(accountId);

      expect(result.isSuccess).toBe(true);
    });

    it('should call findUnique with the correct where and select', async () => {
      findUnique.mockResolvedValue({ id: accountId });

      await acl.existsById(accountId);

      expect(findUnique).toHaveBeenCalledTimes(1);
      expect(findUnique).toHaveBeenCalledWith({
        where: { id: accountId },
        select: { id: true },
      });
    });

    it('should return REFERENCE_ACCOUNT_NOT_FOUND when no row is found', async () => {
      findUnique.mockResolvedValue(null);

      const result = await acl.existsById(accountId);

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.REFERENCE_ACCOUNT_NOT_FOUND);
      expect(result.errors[0].cls).toBe('PrismaTransactionAccountAcl');
      expect(result.errors[0].data).toEqual({ accountId });
    });

    it('should return PRISMA_QUERY_ERROR when findUnique throws', async () => {
      const dbError = new Error('connection refused');
      findUnique.mockRejectedValue(dbError);

      const result = await acl.existsById(accountId);

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
      expect(result.errors[0].cls).toBe('PrismaTransactionAccountAcl');
      expect(result.errors[0].data).toEqual({ accountId, error: String(dbError) });
    });
  });
});
