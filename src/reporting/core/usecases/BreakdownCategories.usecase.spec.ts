import { BreakdownCategoriesDTO } from '@/reporting/core/dto/BreakdownCategories.dto';
import type { CategoryBreakdownRow } from '@/reporting/core/service/BreakdownCategoriesComposer';
import { BreakdownCategoriesComposer } from '@/reporting/core/service/BreakdownCategoriesComposer';
import {
  BreakdownCategoriesQuery,
  BreakdownCategoriesQueryProps,
} from '@/reporting/core/provider/BreakdownCategories.query';
import { BreakdownCategoriesUseCase } from '@/reporting/core/usecases/BreakdownCategories.usecase';
import { Errors } from '@/shared/base/Errors';
import { Result } from '@/shared/base/Result';
import { Money } from '@/shared/ValueObjects';

describe('BreakdownCategoriesUseCase', () => {
  const executeMock = jest.fn<
    Promise<Result<CategoryBreakdownRow[]>>,
    [BreakdownCategoriesQueryProps]
  >();

  class StubBreakdownCategoriesQuery extends BreakdownCategoriesQuery {
    execute(props: BreakdownCategoriesQueryProps): Promise<Result<CategoryBreakdownRow[]>> {
      return executeMock(props);
    }
  }

  beforeEach(() => {
    executeMock.mockReset();
  });

  describe('execute()', () => {
    it('should return period validation failure without calling the query when dates are invalid', async () => {
      const query = new StubBreakdownCategoriesQuery();
      const useCase = new BreakdownCategoriesUseCase(query);

      const result = await useCase.execute({
        startDate: new Date(2024, 2, 10),
        endDate: new Date(2024, 2, 9),
        effectivated: true,
      });

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.END_DATE_NOT_AFTER_START_DATE);
      expect(executeMock).not.toHaveBeenCalled();
    });

    it('should apply the domain composer after the query succeeds', async () => {
      const foodTotal = Money.new(250);
      const rows: CategoryBreakdownRow[] = [{ name: 'Food', total: foodTotal }];
      executeMock.mockResolvedValue(Result.ok(rows));

      const query = new StubBreakdownCategoriesQuery();
      const useCase = new BreakdownCategoriesUseCase(query);

      const startDate = new Date(2024, 5, 1);
      const endDate = new Date(2024, 5, 30);
      const result = await useCase.execute({
        startDate,
        endDate,
        effectivated: false,
      });

      const expectedDto: BreakdownCategoriesDTO = {
        categories: [{ name: 'Food', total: foodTotal }],
      };
      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(expectedDto);
      expect(executeMock).toHaveBeenCalledTimes(1);
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
      executeMock.mockResolvedValue(Result.ok(rows));

      const query = new StubBreakdownCategoriesQuery();
      const useCase = new BreakdownCategoriesUseCase(query);

      const result = await useCase.execute({
        startDate: new Date(2024, 5, 1),
        endDate: new Date(2024, 5, 30),
        effectivated: true,
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
      executeMock.mockResolvedValue(Result.ok([]));

      const query = new StubBreakdownCategoriesQuery();
      const useCase = new BreakdownCategoriesUseCase(query);

      const startDate = new Date(2024, 5, 1);
      const endDate = new Date(2024, 5, 30);
      const categoriesId = [
        'a0000000-0000-4000-8000-000000000001',
        'b0000000-0000-4000-8000-000000000002',
      ];

      await useCase.execute({
        startDate,
        endDate,
        effectivated: true,
        categoriesId,
      });

      expect(executeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          categoriesId,
          effectivated: true,
        }),
      );
    });
  });
});
