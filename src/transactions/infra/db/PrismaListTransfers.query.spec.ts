import { ReportingPeriod } from '@/shared/ValueObjects';
import { Errors } from '@/shared/base/Errors';
import { PrismaService } from '@/shared/infra/PrismaService';
import { PrismaListTransfersQuery } from '@/transactions/infra/db/PrismaListTransfers.query';

const dueDate = new Date('2026-05-15T12:00:00.000Z');
const entryDate = new Date('2026-05-10T12:00:00.000Z');
const effectivatedDate = new Date('2026-05-12T12:00:00.000Z');

const makePeriod = (): ReportingPeriod => {
  const result = ReportingPeriod.create({
    startDate: new Date('2026-05-01T12:00:00.000Z'),
    endDate: new Date('2026-05-31T12:00:00.000Z'),
  });
  if (result.isFailure) throw new Error('Expected ReportingPeriod.create to succeed');
  return result.value;
};

describe('PrismaListTransfersQuery', () => {
  let findMany: jest.Mock;
  let query: PrismaListTransfersQuery;

  beforeEach(() => {
    findMany = jest.fn();
    const prisma = {
      transfer: { findMany },
    } as unknown as PrismaService;
    query = new PrismaListTransfersQuery(prisma);
  });

  it('should return enriched transfer rows', async () => {
    findMany.mockResolvedValue([
      {
        id: 'ffffffff-ffff-4fff-ffff-ffffffffffff',
        name: 'Savings transfer',
        amount: 150,
        notes: 'monthly allocation',
        dueDate,
        entryDate,
        effectivatedDate,
        effectivated: true,
        accountIdOrigin: '11111111-1111-4111-1111-111111111111',
        accountOrigin: { name: 'Checking' },
        accountIdDestination: '22222222-2222-4222-2222-222222222222',
        accountDestination: { name: 'Savings' },
      },
    ]);

    const result = await query.execute({ period: makePeriod() });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual([
      {
        id: 'ffffffff-ffff-4fff-ffff-ffffffffffff',
        name: 'Savings transfer',
        amount: 150,
        notes: 'monthly allocation',
        dueDate,
        entryDate,
        effectivatedDate,
        effectivated: true,
        accountIdOrigin: '11111111-1111-4111-1111-111111111111',
        accountOriginName: 'Checking',
        accountIdDestination: '22222222-2222-4222-2222-222222222222',
        accountDestinationName: 'Savings',
      },
    ]);
  });

  it('should query transfers by entryDate inside the period with required relations', async () => {
    findMany.mockResolvedValue([]);
    const period = makePeriod();

    await query.execute({ period });

    expect(findMany).toHaveBeenCalledWith({
      where: {
        entryDate: {
          gte: period.startDate,
          lte: period.endDate,
        },
      },
      include: {
        accountOrigin: true,
        accountDestination: true,
      },
      orderBy: { entryDate: 'desc' },
    });
  });

  it('should return PRISMA_QUERY_ERROR when findMany throws', async () => {
    findMany.mockRejectedValue(new Error('Connection lost'));

    const result = await query.execute({ period: makePeriod() });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
    expect(result.errors[0].cls).toBe('PrismaListTransfersQuery');
  });
});
