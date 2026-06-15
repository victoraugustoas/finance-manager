import { BreakdownCategoriesDTO } from '@/reporting/core/dto/BreakdownCategories.dto';
import type { CategoryBreakdownRow } from '@/reporting/core/service/BreakdownCategoriesComposer';
import { BreakdownCategoriesComposer } from '@/reporting/core/service/BreakdownCategoriesComposer';
import {
  BreakdownCategoriesReader,
  BreakdownCategoriesReadParams,
} from '@/reporting/core/ports/readers/BreakdownCategoriesReader';
import { BreakdownCategoriesHandler } from '@/reporting/core/queries/BreakdownCategories/BreakdownCategories.handler';
import { Errors } from '@/shared/base/Errors';
import { Result } from '@/shared/base/Result';
import { Money } from '@/shared/ValueObjects';
import { CategoryType } from '@/shared/enums/CategoryType';

describe('BreakdownCategoriesHandler', () => {
  const readMock = jest.fn<
    Promise<Result<CategoryBreakdownRow[]>>,
    [BreakdownCategoriesReadParams]
  >();

  class StubBreakdownCategoriesReader extends BreakdownCategoriesReader {
    read(params: BreakdownCategoriesReadParams): Promise<Result<CategoryBreakdownRow[]>> {
      return readMock(params);
    }
  }

  beforeEach(() => {
    readMock.mockReset();
  });

  describe('handle()', () => {
    it('should return period validation failure without calling the query when dates are invalid', async () => {
      const reader = new StubBreakdownCategoriesReader();
      const handler = new BreakdownCategoriesHandler(reader);

      const result = await handler.handle({
        startDate: new Date(2024, 2, 10),
        endDate: new Date(2024, 2, 9),
        effectivated: true,
        type: CategoryType.EXPENSE,
      });

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.END_DATE_NOT_AFTER_START_DATE);
      expect(readMock).not.toHaveBeenCalled();
    });

    it('should apply the domain composer after the query succeeds', async () => {
      const foodTotal = Money.new(250);
      const rows: CategoryBreakdownRow[] = [{ name: 'Food', total: foodTotal }];
      readMock.mockResolvedValue(Result.ok(rows));

      const reader = new StubBreakdownCategoriesReader();
      const handler = new BreakdownCategoriesHandler(reader);

      const startDate = new Date(2024, 5, 1);
      const endDate = new Date(2024, 5, 30);
      const result = await handler.handle({
        startDate,
        endDate,
        effectivated: false,
        type: CategoryType.EXPENSE,
      });

      const expectedDto: BreakdownCategoriesDTO = {
        categories: [{ name: 'Food', total: foodTotal }],
      };
      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(expectedDto);
      expect(readMock).toHaveBeenCalledTimes(1);
    });

    it('should cap breakdown using the composer when query returns many categories', async () => {
      const rows: CategoryBreakdownRow[] = [
        { name: 'a', total: Money.new(100) },
        { name: 'b', total: Money.new(90) },
        { name: 'c', total: Money.new(80) },
        { name: 'd', total: Money.new(70) },
        { name: 'e', total: Money.new(60) },
        { name: 'f', total: Money.new(50) },
        { name: 'g', total: Money.new(40) },
      ];
      readMock.mockResolvedValue(Result.ok(rows));

      const reader = new StubBreakdownCategoriesReader();
      const handler = new BreakdownCategoriesHandler(reader);

      const result = await handler.handle({
        startDate: new Date(2024, 5, 1),
        endDate: new Date(2024, 5, 30),
        effectivated: true,
        type: CategoryType.EXPENSE,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.categories).toHaveLength(6);

      expect(
        result.value.categories.map(({ name, total }) => ({ name, amount: total.amount })),
      ).toEqual([
        { name: 'a', amount: 100 },
        { name: 'b', amount: 90 },
        { name: BreakdownCategoriesComposer.othersCategoryLabel, amount: 90 },
        { name: 'c', amount: 80 },
        { name: 'd', amount: 70 },
        { name: 'e', amount: 60 },
      ]);
    });

    it('should forward categoriesId to the query', async () => {
      readMock.mockResolvedValue(Result.ok([]));

      const reader = new StubBreakdownCategoriesReader();
      const handler = new BreakdownCategoriesHandler(reader);

      const startDate = new Date(2024, 5, 1);
      const endDate = new Date(2024, 5, 30);
      const categoriesId = [
        'a0000000-0000-4000-8000-000000000001',
        'b0000000-0000-4000-8000-000000000002',
      ];

      await handler.handle({
        startDate,
        endDate,
        effectivated: true,
        categoriesId,
        type: CategoryType.EXPENSE,
      });

      expect(readMock).toHaveBeenCalledWith(
        expect.objectContaining({
          categoriesId,
          effectivated: true,
        }),
      );
    });

    it('should forward type to the query', async () => {
      readMock.mockResolvedValue(Result.ok([]));

      const reader = new StubBreakdownCategoriesReader();
      const handler = new BreakdownCategoriesHandler(reader);

      await handler.handle({
        startDate: new Date(2024, 5, 1),
        endDate: new Date(2024, 5, 30),
        effectivated: false,
        type: CategoryType.INCOME,
      });

      expect(readMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: CategoryType.INCOME }),
      );
    });

    it('should propagate query failure without calling the composer', async () => {
      readMock.mockResolvedValue(
        Result.fail({ code: Errors.PRISMA_QUERY_ERROR, cls: 'StubQuery', data: {} }),
      );

      const reader = new StubBreakdownCategoriesReader();
      const handler = new BreakdownCategoriesHandler(reader);

      const result = await handler.handle({
        startDate: new Date(2024, 5, 1),
        endDate: new Date(2024, 5, 30),
        effectivated: true,
        type: CategoryType.EXPENSE,
      });

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
    });
  });
});
