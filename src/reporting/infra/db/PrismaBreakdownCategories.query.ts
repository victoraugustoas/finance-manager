import { Result } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';
import { PrismaService } from '@/shared/infra/PrismaService';
import { Prisma } from 'generated/prisma/client';
import { Money } from '@/shared/ValueObjects';
import type { CategoryBreakdownRow } from '@/reporting/core/service/BreakdownCategoriesComposer';
import {
  BreakdownCategoriesQuery,
  BreakdownCategoriesQueryProps,
} from '@/reporting/core/provider/BreakdownCategories.query';

type BreakdownAggregateRow = {
  name: string;
  total_cents: bigint | number;
};

export class PrismaBreakdownCategoriesQuery implements BreakdownCategoriesQuery {
  constructor(private readonly prisma: PrismaService) {}

  async execute(props: BreakdownCategoriesQueryProps): Promise<Result<CategoryBreakdownRow[]>> {
    try {
      const categoriesFilter =
        props.categoriesId !== undefined && props.categoriesId.length > 0
          ? Prisma.sql`AND t."categoryId" IN (${Prisma.join(props.categoriesId)})`
          : Prisma.empty;

      const aggregated = await this.prisma.$queryRaw<BreakdownAggregateRow[]>`
        SELECT
          c."name" AS name,
          COALESCE(SUM(t."amount"), 0)::bigint AS total_cents
        FROM "Transaction" t
        INNER JOIN "Category" c ON c."id" = t."categoryId"
        WHERE
          t."entryDate" >= ${props.period.startDate}
          AND t."entryDate" <= ${props.period.endDate}
          AND t."effectivated" = ${props.effectivated}
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
