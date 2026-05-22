import { ReportingPeriod } from '@/shared/ValueObjects';
import { Errors } from '@/shared/base/Errors';
import { PrismaService } from '@/shared/infra/PrismaService';
import { PrismaListExpenseQuery } from '@/transactions/infra/db/PrismaListExpense.query';

jest.mock(
  'generated/prisma/client',
  () => ({ TransactionType: { INCOME: 'INCOME', EXPENSE: 'EXPENSE' } }),
  { virtual: true },
);

const dueDate = new Date('2026-05-15T12:00:00.000Z');
const entryDate = new Date('2026-05-10T12:00:00.000Z');
const paymentDate = new Date('2026-05-12T12:00:00.000Z');

const makePeriod = (): ReportingPeriod => {
  const result = ReportingPeriod.create({
    startDate: new Date('2026-05-01T12:00:00.000Z'),
    endDate: new Date('2026-05-31T12:00:00.000Z'),
  });
  if (result.isFailure) throw new Error('Expected ReportingPeriod.create to succeed');
  return result.value;
};

describe('PrismaListExpenseQuery', () => {
  let findMany: jest.Mock;
  let query: PrismaListExpenseQuery;

  beforeEach(() => {
    findMany = jest.fn();
    const prisma = {
      transaction: { findMany },
    } as unknown as PrismaService;
    query = new PrismaListExpenseQuery(prisma);
  });

  it('should return enriched expense rows', async () => {
    findMany.mockResolvedValue([
      {
        id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
        name: 'Groceries',
        amount: 4990,
        notes: null,
        dueDate,
        entryDate,
        effectivatedDate: paymentDate,
        effectivated: true,
        categoryId: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
        category: { name: 'Food' },
        subCategoryId: 'dddddddd-dddd-4ddd-dddd-dddddddddddd',
        subCategory: { name: 'Groceries' },
        accountId: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
        account: { name: 'Checking' },
      },
    ]);

    const result = await query.execute({ period: makePeriod() });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual([
      {
        id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
        name: 'Groceries',
        amount: 49.9,
        categoryId: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
        categoryName: 'Food',
        subCategoryId: 'dddddddd-dddd-4ddd-dddd-dddddddddddd',
        subCategoryName: 'Groceries',
        notes: undefined,
        dueDate,
        entryDate,
        paymentDate,
        effectivated: true,
        accountId: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
        accountName: 'Checking',
      },
    ]);
  });

  it('should query expenses by entryDate inside the period with required relations', async () => {
    findMany.mockResolvedValue([]);
    const period = makePeriod();

    await query.execute({ period });

    expect(findMany).toHaveBeenCalledWith({
      where: {
        type: 'EXPENSE',
        entryDate: {
          gte: period.startDate,
          lte: period.endDate,
        },
      },
      include: {
        category: true,
        subCategory: true,
        account: true,
      },
      orderBy: { entryDate: 'desc' },
    });
  });

  it('should return PRISMA_QUERY_ERROR when findMany throws', async () => {
    findMany.mockRejectedValue(new Error('Connection lost'));

    const result = await query.execute({ period: makePeriod() });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
    expect(result.errors[0].cls).toBe('PrismaListExpenseQuery');
  });
});
