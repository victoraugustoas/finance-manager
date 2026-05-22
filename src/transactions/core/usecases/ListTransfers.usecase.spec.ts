import { Errors } from '@/shared/base/Errors';
import { Result } from '@/shared/base/Result';
import { ReportingPeriod } from '@/shared/ValueObjects';
import {
  ListTransfersQuery,
  ListTransfersQueryResult,
} from '@/transactions/core/provider/ListTransfers.query';
import { ListTransfersUseCase } from '@/transactions/core/usecases/ListTransfers.usecase';
import { endOfDay, endOfMonth, startOfDay, startOfMonth } from 'date-fns';

const makeTransfer = (): ListTransfersQueryResult => ({
  id: 'ffffffff-ffff-4fff-ffff-ffffffffffff',
  name: 'Savings transfer',
  amount: 150,
  accountIdOrigin: '11111111-1111-4111-1111-111111111111',
  accountOriginName: 'Checking',
  accountIdDestination: '22222222-2222-4222-2222-222222222222',
  accountDestinationName: 'Savings',
  dueDate: new Date('2026-05-15T12:00:00.000Z'),
  entryDate: new Date('2026-05-10T12:00:00.000Z'),
  effectivated: false,
});

describe('ListTransfersUseCase', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('should list transfers using the given period', async () => {
    const transfers = [makeTransfer()];
    const listTransfersQuery = {
      execute: jest.fn().mockResolvedValue(Result.ok(transfers)),
    } as unknown as ListTransfersQuery;
    const useCase = new ListTransfersUseCase(listTransfersQuery);

    const startDate = new Date('2026-01-10T12:00:00.000Z');
    const endDate = new Date('2026-01-20T12:00:00.000Z');
    const result = await useCase.execute({ startDate, endDate });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toBe(transfers);
    expect(listTransfersQuery.execute).toHaveBeenCalledTimes(1);
    const period = (listTransfersQuery.execute as jest.Mock).mock.calls[0][0]
      .period as ReportingPeriod;
    expect(period.startDate).toEqual(startOfDay(startDate));
    expect(period.endDate).toEqual(endOfDay(endDate));
  });

  it('should use the current month when period is not informed', async () => {
    const today = new Date('2026-05-22T12:00:00.000Z');
    jest.useFakeTimers().setSystemTime(today);
    const listTransfersQuery = {
      execute: jest.fn().mockResolvedValue(Result.ok([])),
    } as unknown as ListTransfersQuery;
    const useCase = new ListTransfersUseCase(listTransfersQuery);

    const result = await useCase.execute();

    expect(result.isSuccess).toBe(true);
    expect(listTransfersQuery.execute).toHaveBeenCalledTimes(1);
    const period = (listTransfersQuery.execute as jest.Mock).mock.calls[0][0]
      .period as ReportingPeriod;
    expect(period.startDate).toEqual(startOfDay(startOfMonth(today)));
    expect(period.endDate).toEqual(endOfDay(endOfMonth(today)));
  });

  it('should fail without calling query when period is invalid', async () => {
    const listTransfersQuery = {
      execute: jest.fn(),
    } as unknown as ListTransfersQuery;
    const useCase = new ListTransfersUseCase(listTransfersQuery);

    const result = await useCase.execute({
      startDate: new Date('2026-02-10T00:00:00.000Z'),
      endDate: new Date('2026-02-09T00:00:00.000Z'),
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.END_DATE_NOT_AFTER_START_DATE);
    expect(listTransfersQuery.execute).not.toHaveBeenCalled();
  });

  it('should propagate query failures', async () => {
    const listTransfersQuery = {
      execute: jest.fn().mockResolvedValue(
        Result.fail<ListTransfersQueryResult[]>({
          code: Errors.PRISMA_QUERY_ERROR,
          cls: 'test',
        }),
      ),
    } as unknown as ListTransfersQuery;
    const useCase = new ListTransfersUseCase(listTransfersQuery);

    const result = await useCase.execute({
      startDate: new Date('2026-03-01T00:00:00.000Z'),
      endDate: new Date('2026-03-31T00:00:00.000Z'),
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
  });
});
