import { Result } from '@/shared/base/result';
import { RepositoryErrors } from '@/shared/errors/shared-errors';
import { PrismaService } from '@/shared/infra/prisma.service';
import {
  BreakdownCategoriesQuery,
  BreakdownCategoriesQueryInput,
  CategoryBreakdownRowOutDTO,
} from '@/modules/reporting';
import { Prisma } from 'generated/prisma/client';

type BreakdownAggregateRow = {
  name: string;
  total_cents: bigint | number;
};

export class PrismaBreakdownCategoriesQuery implements BreakdownCategoriesQuery {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    input: BreakdownCategoriesQueryInput,
  ): Promise<Result<CategoryBreakdownRowOutDTO[]>> {
    try {
      const categoriesFilter =
        input.categoriesId !== undefined && input.categoriesId.length > 0
          ? Prisma.sql`AND t."categoryId" IN (${Prisma.join(input.categoriesId)})`
          : Prisma.empty;

      const aggregated = await this.prisma.$queryRaw<BreakdownAggregateRow[]>`
        SELECT
          c."name" AS name,
          COALESCE(SUM(t."amount"), 0)::bigint AS total_cents
        FROM "Transaction" t
        JOIN "Category" c ON c."id" = t."categoryId"
        WHERE
          c."type"::text = ${input.type}
          AND t."entryDate" >= ${input.period.startDate}
          AND t."entryDate" <= ${input.period.endDate}
          ${input.effectivated ? Prisma.sql`AND t."effectivated" = true` : Prisma.empty}
          ${categoriesFilter}
        GROUP BY c."id", c."name"
        ORDER BY SUM(t."amount") DESC
      `;

      return Result.ok(
        aggregated.map((row) => ({
          name: row.name,
          totalInCents: Number(row.total_cents),
        })),
      );
    } catch {
      return Result.fail(RepositoryErrors.READ_FAILED);
    }
  }
}
