import {
  ListAccountsReader,
  ListAccountsReaderResult,
} from '@/reporting/core/ports/readers/ListAccountsReader';
import { Result } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';
import { PrismaService } from '@/shared/infra/PrismaService';
import { Money } from '@/shared/ValueObjects';

export class PrismaListAccountsReader implements ListAccountsReader {
  constructor(private readonly prisma: PrismaService) {}

  async read(): Promise<Result<ListAccountsReaderResult[]>> {
    try {
      const rawAccounts = await this.prisma.account.findMany();

      return Result.ok(
        rawAccounts.map((raw) => ({
          id: raw.id,
          name: raw.name,
          openingBalance: Money.fromCents(raw.openingBalance).value,
        })),
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
