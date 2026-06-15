import { Errors } from '@/shared/base/Errors';
import { Result } from '@/shared/base/Result';
import { ReportingPeriod } from '@/shared/ValueObjects';
import { ListExpenseReader } from '@/transactions/core/ports/readers/ListExpenseReader';
import { ListExpenseResult } from './ListExpense.result';
import { ListExpenseHandler } from '@/transactions/core/queries/ListExpense/ListExpense.handler';
import { endOfDay, endOfMonth, startOfDay, startOfMonth } from 'date-fns';

const makeExpense = (): ListExpenseResult => ({
  id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
  name: 'Groceries',
  amount: 49.9,
  categoryId: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
  categoryName: 'Food',
  subCategoryId: 'dddddddd-dddd-4ddd-dddd-dddddddddddd',
  subCategoryName: 'Groceries',
  accountId: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
  accountName: 'Checking',
  dueDate: new Date('2026-05-15T12:00:00.000Z'),
  entryDate: new Date('2026-05-10T12:00:00.000Z'),
  effectivated: false,
});

describe('ListExpenseHandler', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('should list expenses using the given period', async () => {
    const expenses = [makeExpense()];
    const listExpenseQuery = {
      read: jest.fn().mockResolvedValue(Result.ok(expenses)),
    } as unknown as ListExpenseReader;
    const useCase = new ListExpenseHandler(listExpenseQuery);

    const startDate = new Date('2026-01-10T12:00:00.000Z');
    const endDate = new Date('2026-01-20T12:00:00.000Z');
    const result = await useCase.handle({ startDate, endDate });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toBe(expenses);
    expect(listExpenseQuery.read).toHaveBeenCalledTimes(1);
    const period = (listExpenseQuery.read as jest.Mock).mock.calls[0][0].period as ReportingPeriod;
    expect(period.startDate).toEqual(startOfDay(startDate));
    expect(period.endDate).toEqual(endOfDay(endDate));
  });

  it('should use the current month when period is not informed', async () => {
    const today = new Date('2026-05-22T12:00:00.000Z');
    jest.useFakeTimers().setSystemTime(today);
    const listExpenseQuery = {
      read: jest.fn().mockResolvedValue(Result.ok([])),
    } as unknown as ListExpenseReader;
    const useCase = new ListExpenseHandler(listExpenseQuery);

    const result = await useCase.handle();

    expect(result.isSuccess).toBe(true);
    expect(listExpenseQuery.read).toHaveBeenCalledTimes(1);
    const period = (listExpenseQuery.read as jest.Mock).mock.calls[0][0].period as ReportingPeriod;
    expect(period.startDate).toEqual(startOfDay(startOfMonth(today)));
    expect(period.endDate).toEqual(endOfDay(endOfMonth(today)));
  });

  it('should fail without calling query when period is invalid', async () => {
    const listExpenseQuery = {
      read: jest.fn(),
    } as unknown as ListExpenseReader;
    const useCase = new ListExpenseHandler(listExpenseQuery);

    const result = await useCase.handle({
      startDate: new Date('2026-02-10T00:00:00.000Z'),
      endDate: new Date('2026-02-09T00:00:00.000Z'),
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.END_DATE_NOT_AFTER_START_DATE);
    expect(listExpenseQuery.read).not.toHaveBeenCalled();
  });

  it('should propagate query failures', async () => {
    const listExpenseQuery = {
      read: jest.fn().mockResolvedValue(
        Result.fail<ListExpenseResult[]>({
          code: Errors.PRISMA_QUERY_ERROR,
          cls: 'test',
        }),
      ),
    } as unknown as ListExpenseReader;
    const useCase = new ListExpenseHandler(listExpenseQuery);

    const result = await useCase.handle({
      startDate: new Date('2026-03-01T00:00:00.000Z'),
      endDate: new Date('2026-03-31T00:00:00.000Z'),
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
  });
});
