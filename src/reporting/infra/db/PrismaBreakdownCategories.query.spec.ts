import { PrismaBreakdownCategoriesQuery } from '@/reporting/infra/db/PrismaBreakdownCategories.query';
import { Errors } from '@/shared/base/Errors';
import { PrismaService } from '@/shared/infra/PrismaService';
import { ReportingPeriod } from '@/reporting/core/model/ReportingPeriod';

jest.mock(
  'generated/prisma/client',
  () => ({
    Prisma: {
      sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }),
      join: (values: unknown[]) => values,
      empty: {},
    },
  }),
  { virtual: true },
);

const makePeriod = (): ReportingPeriod => {
  const result = ReportingPeriod.create({
    startDate: new Date(2024, 0, 1),
    endDate: new Date(2024, 0, 31),
  });
  if (result.isFailure) throw new Error('Expected ReportingPeriod.create to succeed in test setup');
  return result.value;
};

describe('PrismaBreakdownCategoriesQuery', () => {
  let queryRaw: jest.Mock;
  let prisma: PrismaService;
  let query: PrismaBreakdownCategoriesQuery;
  const period = makePeriod();

  beforeEach(() => {
    queryRaw = jest.fn();
    prisma = { $queryRaw: queryRaw } as unknown as PrismaService;
    query = new PrismaBreakdownCategoriesQuery(prisma);
  });

  describe('execute()', () => {
    it('should return an empty array when the database returns no rows', async () => {
      queryRaw.mockResolvedValue([]);

      const result = await query.execute({ period, effectivated: true });

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual([]);
    });

    it('should map each row to a CategoryBreakdownRow with a Money total', async () => {
      queryRaw.mockResolvedValue([
        { name: 'Food', total_cents: BigInt(15050) },
        { name: 'Transport', total_cents: BigInt(3000) },
      ]);

      const result = await query.execute({ period, effectivated: true });

      expect(result.isSuccess).toBe(true);
      expect(result.value).toHaveLength(2);
      expect(result.value[0].name).toBe('Food');
      expect(result.value[0].total.amountInCents).toBe(15050);
      expect(result.value[1].name).toBe('Transport');
      expect(result.value[1].total.amountInCents).toBe(3000);
    });

    it('should accept total_cents as a plain number (not bigint)', async () => {
      queryRaw.mockResolvedValue([{ name: 'Salary', total_cents: 200000 }]);

      const result = await query.execute({ period, effectivated: true });

      expect(result.isSuccess).toBe(true);
      expect(result.value[0].total.amountInCents).toBe(200000);
    });

    it('should handle a zero total correctly', async () => {
      queryRaw.mockResolvedValue([{ name: 'Leisure', total_cents: BigInt(0) }]);

      const result = await query.execute({ period, effectivated: true });

      expect(result.isSuccess).toBe(true);
      expect(result.value[0].total.amountInCents).toBe(0);
    });

    it('should return PRISMA_QUERY_ERROR when $queryRaw throws', async () => {
      const dbError = new Error('connection refused');
      queryRaw.mockRejectedValue(dbError);

      const result = await query.execute({ period, effectivated: false });

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
      expect(result.errors[0].cls).toBe('PrismaBreakdownCategoriesQuery');
      expect(result.errors[0].data).toEqual({ error: String(dbError) });
    });

    it('should work when categoriesId contains one or more ids (category filter active)', async () => {
      queryRaw.mockResolvedValue([{ name: 'Food', total_cents: BigInt(9900) }]);

      const result = await query.execute({
        period,
        effectivated: true,
        categoriesId: ['cat-uuid-1', 'cat-uuid-2'],
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value[0].name).toBe('Food');
    });
  });
});
