import { Result } from '@/shared/base/result';
import { RepositoryErrors } from '@/shared/errors/shared-errors';
import { PrismaService } from '@/shared/infra/prisma.service';
import { ListAccountsQuery, ReportingAccountOutDTO } from '@/modules/reporting';

export class PrismaListAccountsQuery implements ListAccountsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<Result<ReportingAccountOutDTO[]>> {
    try {
      const rows = await this.prisma.account.findMany();

      return Result.ok(
        rows.map((row) => ({
          id: row.id,
          name: row.name,
          openingBalanceInCents: row.openingBalance,
        })),
      );
    } catch {
      return Result.fail(RepositoryErrors.READ_FAILED);
    }
  }
}
