import { Result } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';
import { PrismaService } from '@/shared/infra/PrismaService';
import { Prisma } from 'generated/prisma/client';
import { Money } from '@/shared/ValueObjects';
import type { CategoryBreakdownRow } from '@/reporting/core/service/BreakdownCategoriesComposer/BreakdownCategoriesComposer';
import {
  BreakdownCategoriesReader,
  BreakdownCategoriesReadParams,
} from '@/reporting/core/ports/readers/BreakdownCategoriesReader';

type BreakdownAggregateRow = {
  name: string;
  total_cents: bigint | number;
};

export class PrismaBreakdownCategoriesReader implements BreakdownCategoriesReader {
  constructor(private readonly prisma: PrismaService) {}

  async read(params: BreakdownCategoriesReadParams): Promise<Result<CategoryBreakdownRow[]>> {
    try {
      const categoriesFilter =
        params.categoriesId !== undefined && params.categoriesId.length > 0
          ? Prisma.sql`AND t."categoryId" IN (${Prisma.join(params.categoriesId)})`
          : Prisma.empty;

      const aggregated = await this.prisma.$queryRaw<BreakdownAggregateRow[]>`
        SELECT
          c."name" AS name,
          COALESCE(SUM(t."amount"), 0)::bigint AS total_cents
        FROM "Transaction" t
        JOIN "Category" c ON c."id" = t."categoryId"
        WHERE
          c."type"::text = ${params.type}
          AND t."entryDate" >= ${params.period.startDate}
          AND t."entryDate" <= ${params.period.endDate}
          AND t."effectivated" = ${params.effectivated}
          ${categoriesFilter}
        GROUP BY c."id", c."name"
        ORDER BY SUM(t."amount") DESC
      `;

      if (!aggregated.length) {
        return Result.ok([]);
      }

      const rowsWithMoney: CategoryBreakdownRow[] = [];

      for (const row of aggregated) {
        // from database, it is not necessary to use method to verify the result
        const total = Money.fromCents(Number(row.total_cents)).value;
        rowsWithMoney.push({
          name: row.name,
          total: total,
        });
      }

      return Result.ok(rowsWithMoney);
    } catch (e) {
      return Result.fail({
        code: Errors.PRISMA_QUERY_ERROR,
        cls: this.constructor.name,
        data: { error: String(e) },
      });
    }
  }
}
