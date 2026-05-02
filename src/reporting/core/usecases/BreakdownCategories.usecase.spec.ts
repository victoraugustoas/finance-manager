import { BreakdownCategoriesDTO } from '@/reporting/core/dto/BreakdownCategories.dto';
import {
  BreakdownCategoriesQuery,
  BreakdownCategoriesQueryProps,
} from '@/reporting/core/provider/BreakdownCategories.query';
import { BreakdownCategoriesUseCase } from '@/reporting/core/usecases/BreakdownCategories.usecase';
import { Errors } from '@/shared/base/Errors';
import { Result } from '@/shared/base/Result';

describe('BreakdownCategoriesUseCase', () => {
  const executeMock = jest.fn<
    Promise<Result<BreakdownCategoriesDTO>>,
    [BreakdownCategoriesQueryProps]
  >();

  class StubBreakdownCategoriesQuery extends BreakdownCategoriesQuery {
    execute(props: BreakdownCategoriesQueryProps): Promise<Result<BreakdownCategoriesDTO>> {
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
      expect(result.error.code).toBe(Errors.END_DATE_NOT_AFTER_START_DATE);
      expect(executeMock).not.toHaveBeenCalled();
    });

    it('should delegate to the query with a validated period and forward effectivated', async () => {
      const dto: BreakdownCategoriesDTO = {
        categories: [{ name: 'Food', total: 250 }],
      };
      executeMock.mockResolvedValue(Result.ok(dto));

      const query = new StubBreakdownCategoriesQuery();
      const useCase = new BreakdownCategoriesUseCase(query);

      const startDate = new Date(2024, 5, 1);
      const endDate = new Date(2024, 5, 30);
      const result = await useCase.execute({
        startDate,
        endDate,
        effectivated: false,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(dto);
      expect(executeMock).toHaveBeenCalledTimes(1);
    });
  });
});
