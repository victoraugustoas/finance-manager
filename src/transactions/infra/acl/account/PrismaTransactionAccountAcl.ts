import { PrismaService } from '@/shared/infra/PrismaService';
import { Result } from '@/shared/base/Result';
import { Errors } from '@/shared/base/Errors';
import { TransactionAccountQuery } from '../../../core/provider/TransactionAccount.query';

export class PrismaTransactionAccountAcl implements TransactionAccountQuery {
  constructor(private readonly prisma: PrismaService) {}

  async existsById(accountId: string): Promise<Result<void>> {
    try {
      const row = await this.prisma.account.findUnique({
        where: { id: accountId },
        select: { id: true },
      });
      if (!row) {
        return Result.fail({
          code: Errors.REFERENCE_ACCOUNT_NOT_FOUND,
          cls: this.constructor.name,
          data: { accountId },
        });
      }
      return Result.ok(undefined);
    } catch (e) {
      return Result.fail({
        code: Errors.PRISMA_QUERY_ERROR,
        cls: this.constructor.name,
        data: { accountId, error: String(e) },
      });
    }
  }
}
