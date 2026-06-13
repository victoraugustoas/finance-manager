import { Account } from '@/accounts/core/model/Account';
import { AccountsRepository } from '@/accounts/core/provider/accounts.repository';
import { Result } from '@/shared/base';
import { PrismaService } from '@/shared/infra/PrismaService';
import { Errors } from '@/shared/base/Errors';
import { saveWithOutbox } from '@/shared/events/infra/saveWithOutbox';

export class PrismaAccountsRepository implements AccountsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(account: Account): Promise<Result<void>> {
    try {
      await saveWithOutbox(this.prisma, account.domainEvents, async (tx) => {
        await tx.account.upsert({
          where: { id: account.id },
          create: {
            id: account.id,
            name: account.name,
            openingBalance: account.openingBalance.amountInCents,
          },
          update: {
            name: account.name,
          },
        });
      });
      account.clearDomainEvents();
      return Result.ok(undefined);
    } catch (e) {
      return Result.fail({
        code: Errors.PRISMA_INSERT_ERROR,
        cls: this.constructor.name,
        data: { error: String(e) },
      });
    }
  }

  async findById(id: string): Promise<Result<Account>> {
    try {
      const raw = await this.prisma.account.findUnique({ where: { id } });
      if (!raw) {
        return Result.fail({
          code: Errors.PRISMA_QUERY_ERROR,
          cls: this.constructor.name,
          data: { id },
        });
      }
      return Result.ok(
        Account.new({
          id: raw.id,
          name: raw.name,
          openingBalance: raw.openingBalance / 100,
        }),
      );
    } catch (e) {
      return Result.fail({
        code: Errors.PRISMA_QUERY_ERROR,
        cls: this.constructor.name,
        data: { error: String(e) },
      });
    }
  }

  async findAll(): Promise<Result<Account[]>> {
    try {
      const rawAccounts = await this.prisma.account.findMany();

      return Result.ok(
        rawAccounts.map((raw) =>
          Account.new({
            id: raw.id,
            name: raw.name,
            openingBalance: raw.openingBalance / 100,
          }),
        ),
      );
    } catch (e) {
      return Result.fail({
        code: Errors.PRISMA_QUERY_ERROR,
        cls: this.constructor.name,
        data: { error: String(e) },
      });
    }
  }
}
