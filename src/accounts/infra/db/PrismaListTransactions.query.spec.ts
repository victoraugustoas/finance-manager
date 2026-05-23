import { ReportingPeriod } from '@/shared/ValueObjects';
import { Errors } from '@/shared/base/Errors';
import { PrismaService } from '@/shared/infra/PrismaService';
import { PrismaListTransactionsQuery } from '@/accounts/infra/db/PrismaListTransactions.query';

jest.mock(
  'generated/prisma/client',
  () => ({ TransactionType: { INCOME: 'INCOME', EXPENSE: 'EXPENSE' } }),
  { virtual: true },
);

const ACCOUNT_ID = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const OTHER_ACCOUNT_ID = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const dueDate = new Date('2026-05-15T12:00:00.000Z');

const makePeriod = (): ReportingPeriod => {
  const result = ReportingPeriod.create({
    startDate: new Date('2026-05-01T00:00:00.000Z'),
    endDate: new Date('2026-05-31T23:59:59.000Z'),
  });
  if (result.isFailure) throw new Error('Expected ReportingPeriod.create to succeed');
  return result.value;
};

describe('PrismaListTransactionsQuery', () => {
  let transactionFindMany: jest.Mock;
  let transferFindMany: jest.Mock;
  let query: PrismaListTransactionsQuery;

  beforeEach(() => {
    transactionFindMany = jest.fn().mockResolvedValue([]);
    transferFindMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      transaction: { findMany: transactionFindMany },
      transfer: { findMany: transferFindMany },
    } as unknown as PrismaService;
    query = new PrismaListTransactionsQuery(prisma);
  });

  describe('transaction mapping', () => {
    it('should map an INCOME transaction to movementType INCOME', async () => {
      transactionFindMany.mockResolvedValue([{ amount: 10000, type: 'INCOME', dueDate }]);

      const result = await query.execute({ accountId: ACCOUNT_ID, period: makePeriod() });

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual([{ amountInCents: 10000, movementType: 'INCOME', dueDate }]);
    });

    it('should map an EXPENSE transaction to movementType EXPENSE', async () => {
      transactionFindMany.mockResolvedValue([{ amount: 5000, type: 'EXPENSE', dueDate }]);

      const result = await query.execute({ accountId: ACCOUNT_ID, period: makePeriod() });

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual([{ amountInCents: 5000, movementType: 'EXPENSE', dueDate }]);
    });
  });

  describe('transfer mapping', () => {
    it('should map a transfer where the account is the origin to TRANSFER_OUT', async () => {
      transferFindMany.mockResolvedValue([{ amount: 3000, accountIdOrigin: ACCOUNT_ID, dueDate }]);

      const result = await query.execute({ accountId: ACCOUNT_ID, period: makePeriod() });

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual([
        { amountInCents: 3000, movementType: 'TRANSFER_OUT', dueDate },
      ]);
    });

    it('should map a transfer where the account is the destination to TRANSFER_IN', async () => {
      transferFindMany.mockResolvedValue([
        { amount: 7000, accountIdOrigin: OTHER_ACCOUNT_ID, dueDate },
      ]);

      const result = await query.execute({ accountId: ACCOUNT_ID, period: makePeriod() });

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual([{ amountInCents: 7000, movementType: 'TRANSFER_IN', dueDate }]);
    });
  });

  describe('query parameters', () => {
    it('should query transactions with correct where clause', async () => {
      const period = makePeriod();

      await query.execute({ accountId: ACCOUNT_ID, period });

      expect(transactionFindMany).toHaveBeenCalledWith({
        where: {
          accountId: ACCOUNT_ID,
          effectivated: false,
          dueDate: { gte: period.startDate, lte: period.endDate },
        },
        select: { amount: true, type: true, dueDate: true },
      });
    });

    it('should query transfers with OR clause covering both origin and destination', async () => {
      const period = makePeriod();

      await query.execute({ accountId: ACCOUNT_ID, period });

      expect(transferFindMany).toHaveBeenCalledWith({
        where: {
          OR: [{ accountIdOrigin: ACCOUNT_ID }, { accountIdDestination: ACCOUNT_ID }],
          effectivated: false,
          dueDate: { gte: period.startDate, lte: period.endDate },
        },
        select: { amount: true, accountIdOrigin: true, dueDate: true },
      });
    });

    it('should run both queries in parallel and combine results', async () => {
      transactionFindMany.mockResolvedValue([{ amount: 1000, type: 'INCOME', dueDate }]);
      transferFindMany.mockResolvedValue([
        { amount: 2000, accountIdOrigin: OTHER_ACCOUNT_ID, dueDate },
      ]);

      const result = await query.execute({ accountId: ACCOUNT_ID, period: makePeriod() });

      expect(result.isSuccess).toBe(true);
      expect(result.value).toHaveLength(2);
      expect(result.value[0].movementType).toBe('INCOME');
      expect(result.value[1].movementType).toBe('TRANSFER_IN');
    });
  });

  describe('error handling', () => {
    it('should return PRISMA_QUERY_ERROR when transaction query throws', async () => {
      transactionFindMany.mockRejectedValue(new Error('Connection lost'));

      const result = await query.execute({ accountId: ACCOUNT_ID, period: makePeriod() });

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
      expect(result.errors[0].cls).toBe('PrismaListTransactionsQuery');
    });

    it('should return PRISMA_QUERY_ERROR when transfer query throws', async () => {
      transferFindMany.mockRejectedValue(new Error('Timeout'));

      const result = await query.execute({ accountId: ACCOUNT_ID, period: makePeriod() });

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
    });
  });
});
