import { BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { BreakdownCategoriesDTO } from '@/reporting/core/dto/BreakdownCategories.dto';
import { BreakdownCategoriesHandler } from '@/reporting/core/queries/BreakdownCategories/BreakdownCategories.handler';
import { ListAccountsHandler } from '@/reporting/core/queries/ListAccounts/ListAccounts.handler';
import { BreakdownCategoriesQueryDto } from '@/reporting/infra/dtos/BreakdownCategoriesQuery.dto';
import { Errors } from '@/shared/base/Errors';
import { Result } from '@/shared/base/Result';
import { Money } from '@/shared/ValueObjects';
import { CategoryType } from '@/shared/enums/CategoryType';
import { ReportingController } from './Reporting.controller';

describe('ReportingController', () => {
  let controller: ReportingController;
  let breakdownHandleMock: jest.Mock;
  let listAccountsHandleMock: jest.Mock;

  beforeEach(() => {
    breakdownHandleMock = jest.fn();
    listAccountsHandleMock = jest.fn();
    controller = new ReportingController(
      {
        handle: breakdownHandleMock,
      } as unknown as BreakdownCategoriesHandler,
      {
        handle: listAccountsHandleMock,
      } as unknown as ListAccountsHandler,
    );
  });

  describe('listAccounts()', () => {
    it('should call ListAccountsHandler.handle with parsed endDate', async () => {
      listAccountsHandleMock.mockResolvedValue(Result.ok([]));

      await controller.listAccounts({ endDate: '2026-01-31T23:59:59.999Z' });

      expect(listAccountsHandleMock).toHaveBeenCalledTimes(1);
      expect(listAccountsHandleMock).toHaveBeenCalledWith({
        endDate: new Date('2026-01-31T23:59:59.999Z'),
      });
    });

    it('should return ListAccountsResponseDto mapped from listed accounts', async () => {
      const checking = {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Checking',
        openingBalance: Money.new(25),
      };
      const savings = {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Savings',
        openingBalance: Money.new(150),
      };
      listAccountsHandleMock.mockResolvedValue(
        Result.ok([
          {
            account: checking,
            balance: Money.create(95).value,
            estimatedBalance: Money.create(110).value,
          },
          {
            account: savings,
            balance: Money.create(175).value,
            estimatedBalance: Money.create(190).value,
          },
        ]),
      );

      const response = await controller.listAccounts({ endDate: '2026-01-31T23:59:59.999Z' });

      expect(response.accounts).toEqual([
        {
          id: checking.id,
          name: 'Checking',
          openingBalance: 25,
          balance: 95,
          estimatedBalance: 110,
        },
        {
          id: savings.id,
          name: 'Savings',
          openingBalance: 150,
          balance: 175,
          estimatedBalance: 190,
        },
      ]);
    });

    it('should log and throw InternalServerErrorException when list fails', async () => {
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      listAccountsHandleMock.mockResolvedValue(Result.fail({ code: Errors.PRISMA_QUERY_ERROR }));

      await expect(
        controller.listAccounts({ endDate: '2026-01-31T23:59:59.999Z' }),
      ).rejects.toThrow(InternalServerErrorException);

      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      expect(String(loggerErrorSpy.mock.calls[0]?.[0])).toContain('Error during list accounts');

      loggerErrorSpy.mockRestore();
    });
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
      breakdownHandleMock.mockResolvedValue(Result.ok(dto));

      await controller.breakdownCategories(query);

      expect(breakdownHandleMock).toHaveBeenCalledTimes(1);
      expect(breakdownHandleMock).toHaveBeenCalledWith({
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
      breakdownHandleMock.mockResolvedValue(Result.ok(dto));

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
      breakdownHandleMock.mockResolvedValue(Result.fail({ code: Errors.PRISMA_QUERY_ERROR }));

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
      breakdownHandleMock.mockResolvedValue(
        Result.fail({ code: Errors.END_DATE_NOT_AFTER_START_DATE }),
      );

      await expect(controller.breakdownCategories(query)).rejects.toThrow(BadRequestException);

      loggerErrorSpy.mockRestore();
    });
  });
});
