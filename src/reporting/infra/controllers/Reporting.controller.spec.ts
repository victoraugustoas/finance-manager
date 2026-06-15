import { BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { BreakdownCategoriesDTO } from '@/reporting/core/dto/BreakdownCategories.dto';
import { BreakdownCategoriesHandler } from '@/reporting/core/queries/BreakdownCategories/BreakdownCategories.handler';
import { BreakdownCategoriesQueryDto } from '@/reporting/infra/dtos/BreakdownCategoriesQuery.dto';
import { Errors } from '@/shared/base/Errors';
import { Result } from '@/shared/base/Result';
import { Money } from '@/shared/ValueObjects';
import { CategoryType } from '@/shared/enums/CategoryType';
import { ReportingController } from './Reporting.controller';

describe('ReportingController', () => {
  let controller: ReportingController;
  let handleMock: jest.Mock;

  beforeEach(() => {
    handleMock = jest.fn();
    controller = new ReportingController({
      handle: handleMock,
    } as unknown as BreakdownCategoriesHandler);
  });

  describe('breakdownCategories()', () => {
    it('should call BreakdownCategoriesHandler.handle with parsed dates and filters', async () => {
      const query: BreakdownCategoriesQueryDto = {
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-01-31T23:59:59.999Z',
        effectivated: true,
        categoriesId: [
          'a0000000-0000-4000-8000-000000000001',
          'b0000000-0000-4000-8000-000000000002',
        ],
        type: CategoryType.EXPENSE,
      };
      const dto: BreakdownCategoriesDTO = {
        categories: [{ name: 'Food', total: Money.new(10) }],
      };
      handleMock.mockResolvedValue(Result.ok(dto));

      await controller.breakdownCategories(query);

      expect(handleMock).toHaveBeenCalledTimes(1);
      expect(handleMock).toHaveBeenCalledWith({
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: new Date('2026-01-31T23:59:59.999Z'),
        effectivated: true,
        categoriesId: query.categoriesId,
        type: CategoryType.EXPENSE,
      });
    });

    it('should return BreakdownCategoriesResponseDto mapped from the use case result', async () => {
      const query: BreakdownCategoriesQueryDto = {
        startDate: '2026-02-01T00:00:00.000Z',
        endDate: '2026-02-28T23:59:59.999Z',
        effectivated: false,
        type: CategoryType.INCOME,
      };
      const dto: BreakdownCategoriesDTO = {
        categories: [
          { name: 'Rent', total: Money.new(1500) },
          { name: 'Food', total: Money.new(42.5) },
        ],
      };
      handleMock.mockResolvedValue(Result.ok(dto));

      const response = await controller.breakdownCategories(query);

      expect(response.categories).toHaveLength(2);
      expect(response.categories[0]).toEqual({ name: 'Rent', total: 1500 });
      expect(response.categories[1]).toEqual({ name: 'Food', total: 42.5 });
    });

    it('should log and throw InternalServerErrorException when query fails', async () => {
      const query: BreakdownCategoriesQueryDto = {
        startDate: '2026-03-01T00:00:00.000Z',
        endDate: '2026-03-31T23:59:59.999Z',
        effectivated: true,
        type: CategoryType.EXPENSE,
      };
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      handleMock.mockResolvedValue(Result.fail({ code: Errors.PRISMA_QUERY_ERROR }));

      await expect(controller.breakdownCategories(query)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      expect(String(loggerErrorSpy.mock.calls[0]?.[0])).toContain(
        'Error during breakdown categories',
      );

      loggerErrorSpy.mockRestore();
    });

    it('should throw BadRequestException when period validation fails upstream', async () => {
      const query: BreakdownCategoriesQueryDto = {
        startDate: '2026-04-10T00:00:00.000Z',
        endDate: '2026-04-09T00:00:00.000Z',
        effectivated: false,
        type: CategoryType.EXPENSE,
      };
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      handleMock.mockResolvedValue(Result.fail({ code: Errors.END_DATE_NOT_AFTER_START_DATE }));

      await expect(controller.breakdownCategories(query)).rejects.toThrow(BadRequestException);

      loggerErrorSpy.mockRestore();
    });
  });
});
