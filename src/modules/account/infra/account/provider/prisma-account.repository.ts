import { Result } from '@/shared/base/result';
import { RepositoryErrors } from '@/shared/errors/shared-errors';
import { PrismaService } from '@/shared/infra/prisma.service';
import { Account, AccountRepository } from '@/modules/account';

export class PrismaAccountRepository implements AccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(entity: Account): Promise<Result<void>> {
    return this.upsert(entity);
  }

  async update(entity: Account): Promise<Result<void>> {
    return this.upsert(entity);
  }

  async findById(id: string): Promise<Result<Account>> {
    try {
      const row = await this.prisma.account.findUnique({ where: { id } });
      if (!row) {
        return Result.fail(RepositoryErrors.ENTITY_NOT_FOUND);
      }

      return Account.tryCreate({
        id: row.id,
        name: row.name,
        openingBalance: row.openingBalance,
      });
    } catch {
      return Result.fail(RepositoryErrors.READ_FAILED);
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      await this.prisma.account.delete({ where: { id } });
      return Result.ok();
    } catch {
      return Result.fail(RepositoryErrors.WRITE_FAILED);
    }
  }

  private async upsert(entity: Account): Promise<Result<void>> {
    try {
      await this.prisma.account.upsert({
        where: { id: entity.id },
        create: {
          id: entity.id,
          name: entity.name,
          openingBalance: entity.openingBalance.amountInCents,
        },
        update: {
          name: entity.name,
        },
      });
      return Result.ok();
    } catch {
      return Result.fail(RepositoryErrors.WRITE_FAILED);
    }
  }
}
