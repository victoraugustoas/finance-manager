import { Logger, NotFoundException } from '@nestjs/common';
import { Result } from '@/shared/base/result';
import { CategoryType } from '@/shared/enums/category-type';
import {
  FindAccountsWithBalance,
  FindBreakdownCategories,
  FindStatement,
  ReportingErrors,
} from '@/modules/reporting';
import { ReportingController } from '../../infra/reporting/reporting.controller';

describe('ReportingController', () => {
  let controller: ReportingController;
  let findAccounts: jest.Mock;
  let findBreakdown: jest.Mock;
  let findStatement: jest.Mock;

  beforeEach(() => {
    findAccounts = jest.fn();
    findBreakdown = jest.fn();
    findStatement = jest.fn();
    controller = new ReportingController(
      { execute: findAccounts } as unknown as FindAccountsWithBalance,
      { execute: findBreakdown } as unknown as FindBreakdownCategories,
      { execute: findStatement } as unknown as FindStatement,
    );
  });

  test('should expose account balances as decimal amounts', async () => {
    findAccounts.mockResolvedValue(
      Result.ok([
        {
          account: {
            id: '11111111-1111-1111-1111-111111111111',
            name: 'Checking',
            openingBalanceInCents: 10050,
          },
          balanceInCents: 20100,
          estimatedBalanceInCents: 24575,
        },
      ]),
    );

    const response = await controller.listAccounts({ endDate: '2026-01-31T23:59:59.999Z' });

    expect(findAccounts).toHaveBeenCalledWith({
      endDate: new Date('2026-01-31T23:59:59.999Z'),
    });
    expect(response.accounts[0]).toEqual({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Checking',
      openingBalance: 100.5,
      balance: 201,
      estimatedBalance: 245.75,
    });
  });

  test('should expose breakdown totals as decimal amounts', async () => {
    findBreakdown.mockResolvedValue(
      Result.ok({ categories: [{ name: 'Food', totalInCents: 12550 }] }),
    );

    const response = await controller.breakdownCategories({
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-01-31T23:59:59.999Z',
      effectivated: true,
      type: CategoryType.EXPENSE,
    });

    expect(response.categories).toEqual([{ name: 'Food', total: 125.5 }]);
  });

  test('should serialize statement dates and balances', async () => {
    findStatement.mockResolvedValue(
      Result.ok({
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: new Date('2026-01-31T23:59:59.999Z'),
        accountId: undefined,
        initialBalanceInCents: 100000,
        finalBalanceInCents: 125050,
        days: [],
      }),
    );

    const response = await controller.statement({
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-01-31T23:59:59.999Z',
    });

    expect(response.initialBalance).toBe(1000);
    expect(response.finalBalance).toBe(1250.5);
    expect(response.startDate).toBe('2026-01-01T00:00:00.000Z');
  });

  test('should translate a missing account into 404', async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    findStatement.mockResolvedValue(Result.fail(ReportingErrors.ACCOUNT_NOT_FOUND));

    await expect(
      controller.statement({
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-01-31T23:59:59.999Z',
        accountId: '11111111-1111-1111-1111-111111111111',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
