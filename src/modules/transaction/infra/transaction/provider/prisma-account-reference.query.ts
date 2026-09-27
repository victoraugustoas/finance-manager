import { Result } from '@/shared/base/result';
import { RepositoryErrors } from '@/shared/errors/shared-errors';
import { PrismaService } from '@/shared/infra/prisma.service';
import {
  AccountReferenceErrors,
  AccountReferenceQuery,
  AccountReferenceQueryInput,
} from '@/modules/transaction';

export class PrismaAccountReferenceQuery implements AccountReferenceQuery {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: AccountReferenceQueryInput): Promise<Result<void>> {
    try {
      const row = await this.prisma.account.findUnique({
        where: { id: input.accountId },
        select: { id: true },
      });
      if (!row) {
        return Result.fail(AccountReferenceErrors.ACCOUNT_NOT_FOUND);
      }

      return Result.ok();
    } catch {
      return Result.fail(RepositoryErrors.READ_FAILED);
    }
  }
}
