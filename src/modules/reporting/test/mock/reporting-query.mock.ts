import { Result } from '@/shared/base/result';
import {
  BreakdownCategoriesQuery,
  CategoryBreakdownRowOutDTO,
  ListAccountsQuery,
  ListMovementsQuery,
  ListMovementsQueryInput,
  MovementOutDTO,
  ReportingAccountOutDTO,
} from '@/modules/reporting';

export const stubListAccounts = (accounts: ReportingAccountOutDTO[]): ListAccountsQuery => ({
  execute: jest.fn().mockResolvedValue(Result.ok(accounts)),
});

/**
 * Serves movements per account, optionally splitting settled from pending so balance
 * expectations mirror what the Prisma adapter would filter.
 */
export const stubListMovements = (
  movementsByAccount: Record<string, MovementOutDTO[]>,
): ListMovementsQuery => ({
  execute: jest.fn(async (input: ListMovementsQueryInput) => {
    const movements = movementsByAccount[input.accountId] ?? [];
    const filtered =
      input.effectivated === undefined
        ? movements
        : movements.filter((movement) => movement.effectivated === input.effectivated);

    return Result.ok(filtered);
  }),
});

export const stubBreakdownCategories = (
  rows: CategoryBreakdownRowOutDTO[],
): BreakdownCategoriesQuery => ({
  execute: jest.fn().mockResolvedValue(Result.ok(rows)),
});

export const failingBreakdownCategories = (code: string): BreakdownCategoriesQuery => ({
  execute: jest.fn().mockResolvedValue(Result.fail(code)),
});
