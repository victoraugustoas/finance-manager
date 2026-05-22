import { Errors } from '@/shared/base/Errors';
import { Result } from '@/shared/base/Result';
import { ReportingPeriod } from '@/shared/ValueObjects';
import {
  ListIncomeQuery,
  ListIncomeQueryResult,
} from '@/transactions/core/provider/ListIncome.query';
import { ListIncomeUseCase } from '@/transactions/core/usecases/ListIncome.usecase';
import { endOfDay, endOfMonth, startOfDay, startOfMonth } from 'date-fns';

const makeIncome = (): ListIncomeQueryResult => ({
  id: 'eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee',
  name: 'Salary',
  amount: 3500,
  categoryId: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
  categoryName: 'Salary',
  subCategoryId: 'dddddddd-dddd-4ddd-dddd-dddddddddddd',
  subCategoryName: 'Monthly salary',
  accountId: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
  accountName: 'Checking',
  dueDate: new Date('2026-05-15T12:00:00.000Z'),
  entryDate: new Date('2026-05-10T12:00:00.000Z'),
  effectivated: false,
});

describe('ListIncomeUseCase', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('should list incomes using the given period', async () => {
    const incomes = [makeIncome()];
    const listIncomeQuery = {
      execute: jest.fn().mockResolvedValue(Result.ok(incomes)),
    } as unknown as ListIncomeQuery;
    const useCase = new ListIncomeUseCase(listIncomeQuery);

    const startDate = new Date('2026-01-10T12:00:00.000Z');
    const endDate = new Date('2026-01-20T12:00:00.000Z');
    const result = await useCase.execute({ startDate, endDate });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toBe(incomes);
    expect(listIncomeQuery.execute).toHaveBeenCalledTimes(1);
    const period = (listIncomeQuery.execute as jest.Mock).mock.calls[0][0]
      .period as ReportingPeriod;
    expect(period.startDate).toEqual(startOfDay(startDate));
    expect(period.endDate).toEqual(endOfDay(endDate));
  });

  it('should use the current month when period is not informed', async () => {
    const today = new Date('2026-05-22T12:00:00.000Z');
    jest.useFakeTimers().setSystemTime(today);
    const listIncomeQuery = {
      execute: jest.fn().mockResolvedValue(Result.ok([])),
    } as unknown as ListIncomeQuery;
    const useCase = new ListIncomeUseCase(listIncomeQuery);

    const result = await useCase.execute();

    expect(result.isSuccess).toBe(true);
    expect(listIncomeQuery.execute).toHaveBeenCalledTimes(1);
    const period = (listIncomeQuery.execute as jest.Mock).mock.calls[0][0]
      .period as ReportingPeriod;
    expect(period.startDate).toEqual(startOfDay(startOfMonth(today)));
    expect(period.endDate).toEqual(endOfDay(endOfMonth(today)));
  });

  it('should fail without calling query when period is invalid', async () => {
    const listIncomeQuery = {
      execute: jest.fn(),
    } as unknown as ListIncomeQuery;
    const useCase = new ListIncomeUseCase(listIncomeQuery);

    const result = await useCase.execute({
      startDate: new Date('2026-02-10T00:00:00.000Z'),
      endDate: new Date('2026-02-09T00:00:00.000Z'),
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.END_DATE_NOT_AFTER_START_DATE);
    expect(listIncomeQuery.execute).not.toHaveBeenCalled();
  });

  it('should propagate query failures', async () => {
    const listIncomeQuery = {
      execute: jest.fn().mockResolvedValue(
        Result.fail<ListIncomeQueryResult[]>({
          code: Errors.PRISMA_QUERY_ERROR,
          cls: 'test',
        }),
      ),
    } as unknown as ListIncomeQuery;
    const useCase = new ListIncomeUseCase(listIncomeQuery);

    const result = await useCase.execute({
      startDate: new Date('2026-03-01T00:00:00.000Z'),
      endDate: new Date('2026-03-31T00:00:00.000Z'),
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
  });
});
