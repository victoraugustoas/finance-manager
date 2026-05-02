import { Account } from '@/accounts/core/model/Account';
import { AccountsRepository } from '@/accounts/core/provider/accounts.repository';
import { Result } from '@/shared/base';
import { PrismaService } from '@/shared/infra/PrismaService';
import { Errors } from '@/shared/base/Errors';

export class PrismaAccountsRepository implements AccountsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(account: Account): Promise<Result<void>> {
    try {
      await this.prisma.account.create({
        data: {
          name: account.name,
          balance: account.balance.amountInCents,
          openingBalance: account.openingBalance.amountInCents,
          id: account.id,
        },
      });
      return Result.ok(undefined);
    } catch (e) {
      return Result.fail({
        code: Errors.PRISMA_INSERT_ERROR,
        cls: this.constructor.name,
        data: { error: String(e) },
      });
    }
  }
}
