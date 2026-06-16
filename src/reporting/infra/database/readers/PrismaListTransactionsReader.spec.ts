import { PrismaListTransactionsReader } from '@/reporting/infra/database/readers/PrismaListTransactionsReader';
import { ReportingPeriod } from '@/shared/ValueObjects';
import { Errors } from '@/shared/base/Errors';
import { PrismaService } from '@/shared/infra/PrismaService';

jest.mock(
  'generated/prisma/client',
  () => ({ TransactionType: { INCOME: 'INCOME', EXPENSE: 'EXPENSE' } }),
  { virtual: true },
);

const ACCOUNT_ID = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const OTHER_ACCOUNT_ID = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const dueDate = new Date('2026-05-15T12:00:00.000Z');
const entryDate = new Date('2026-05-01T12:00:00.000Z');
const effectivatedDate = new Date('2026-05-16T12:00:00.000Z');
const account = { id: ACCOUNT_ID, name: 'Checking' };
const originAccount = { id: ACCOUNT_ID, name: 'Checking' };
const destinationAccount = { id: OTHER_ACCOUNT_ID, name: 'Savings' };
const category = { id: 'category-1', name: 'Salary' };
const subCategory = { id: 'subcategory-1', name: 'Monthly' };

type RawTransaction = {
  id: string;
  name: string;
  amount: number;
  notes: string | null;
  dueDate: Date;
  entryDate: Date;
  effectivated: boolean;
  effectivatedDate: Date | null;
  type: 'INCOME' | 'EXPENSE';
  account: typeof account;
  category: typeof category;
  subCategory: typeof subCategory;
};

type RawTransfer = {
  id: string;
  name: string;
  amount: number;
  notes: string | null;
  dueDate: Date;
  entryDate: Date;
  effectivated: boolean;
  effectivatedDate: Date | null;
  accountIdOrigin: string;
  accountOrigin: typeof originAccount;
  accountDestination: typeof destinationAccount;
};

const transactionSelect = {
  id: true,
  name: true,
  amount: true,
  notes: true,
  dueDate: true,
  entryDate: true,
  effectivated: true,
  effectivatedDate: true,
  type: true,
  account: { select: { id: true, name: true } },
  category: { select: { id: true, name: true } },
  subCategory: { select: { id: true, name: true } },
};

const transferSelect = {
  id: true,
  name: true,
  amount: true,
  notes: true,
  dueDate: true,
  entryDate: true,
  effectivated: true,
  effectivatedDate: true,
  accountIdOrigin: true,
  accountOrigin: { select: { id: true, name: true } },
  accountDestination: { select: { id: true, name: true } },
};

const makeRawTransaction = (props: Partial<RawTransaction> = {}): RawTransaction => ({
  id: 'transaction-1',
  name: 'Salary',
  amount: 10000,
  notes: null,
  dueDate,
  entryDate,
  effectivated: true,
  effectivatedDate,
  type: 'INCOME',
  account,
  category,
  subCategory,
  ...props,
});

const makeRawTransfer = (props: Partial<RawTransfer> = {}): RawTransfer => ({
  id: 'transfer-1',
  name: 'Transfer to savings',
  amount: 3000,
  notes: null,
  dueDate,
  entryDate,
  effectivated: true,
  effectivatedDate,
  accountIdOrigin: ACCOUNT_ID,
  accountOrigin: originAccount,
  accountDestination: destinationAccount,
  ...props,
});

const makePeriod = (): ReportingPeriod => {
  const result = ReportingPeriod.create({
    startDate: new Date('2026-05-01T00:00:00.000Z'),
    endDate: new Date('2026-05-31T23:59:59.000Z'),
  });
  if (result.isFailure) throw new Error('Expected ReportingPeriod.create to succeed');
  return result.value;
};

describe('PrismaListTransactionsReader', () => {
  let transactionFindMany: jest.Mock;
  let transferFindMany: jest.Mock;
  let query: PrismaListTransactionsReader;

  beforeEach(() => {
    transactionFindMany = jest.fn().mockResolvedValue([]);
    transferFindMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      transaction: { findMany: transactionFindMany },
      transfer: { findMany: transferFindMany },
    } as unknown as PrismaService;
    query = new PrismaListTransactionsReader(prisma);
  });

  describe('transaction mapping', () => {
    it('should map an INCOME transaction to movementType INCOME', async () => {
      transactionFindMany.mockResolvedValue([makeRawTransaction({ amount: 10000 })]);

      const result = await query.listTransactions({
        accountId: ACCOUNT_ID,
        period: makePeriod(),
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value[0]).toMatchObject({
        id: 'transaction-1',
        movementType: 'INCOME',
        name: 'Salary',
        dueDate,
        entryDate,
        effectivated: true,
        effectivatedDate,
        notes: null,
        account,
        category,
        subCategory,
      });
      expect(result.value[0].amount.amountInCents).toBe(10000);
    });

    it('should map an EXPENSE transaction to movementType EXPENSE', async () => {
      transactionFindMany.mockResolvedValue([
        makeRawTransaction({ amount: 5000, type: 'EXPENSE' }),
      ]);

      const result = await query.listTransactions({
        accountId: ACCOUNT_ID,
        period: makePeriod(),
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value[0].movementType).toBe('EXPENSE');
      expect(result.value[0].amount.amountInCents).toBe(5000);
    });
  });

  describe('transfer mapping', () => {
    it('should map a transfer where the account is the origin to TRANSFER_OUT', async () => {
      transferFindMany.mockResolvedValue([makeRawTransfer({ amount: 3000 })]);

      const result = await query.listTransactions({
        accountId: ACCOUNT_ID,
        period: makePeriod(),
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value[0]).toMatchObject({
        id: 'transfer-1',
        movementType: 'TRANSFER_OUT',
        name: 'Transfer to savings',
        dueDate,
        entryDate,
        effectivated: true,
        effectivatedDate,
        notes: null,
        originAccount,
        destinationAccount,
      });
      expect(result.value[0].amount.amountInCents).toBe(3000);
    });

    it('should map a transfer where the account is the destination to TRANSFER_IN', async () => {
      transferFindMany.mockResolvedValue([
        makeRawTransfer({ amount: 7000, accountIdOrigin: OTHER_ACCOUNT_ID }),
      ]);

      const result = await query.listTransactions({
        accountId: ACCOUNT_ID,
        period: makePeriod(),
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value[0].movementType).toBe('TRANSFER_IN');
      expect(result.value[0].amount.amountInCents).toBe(7000);
    });
  });

  describe('query parameters', () => {
    it('should query transactions and transfers with period and effectivated filters', async () => {
      const period = makePeriod();

      await query.listTransactions({ accountId: ACCOUNT_ID, period, effectivated: true });

      expect(transactionFindMany).toHaveBeenCalledWith({
        where: {
          accountId: ACCOUNT_ID,
          effectivated: true,
          dueDate: { gte: period.startDate, lte: period.endDate },
        },
        select: transactionSelect,
      });
      expect(transferFindMany).toHaveBeenCalledWith({
        where: {
          OR: [{ accountIdOrigin: ACCOUNT_ID }, { accountIdDestination: ACCOUNT_ID }],
          effectivated: true,
          dueDate: { gte: period.startDate, lte: period.endDate },
        },
        select: transferSelect,
      });
    });

    it('should omit optional filters when they are not provided', async () => {
      await query.listTransactions({ accountId: ACCOUNT_ID });

      expect(transactionFindMany).toHaveBeenCalledWith({
        where: {
          accountId: ACCOUNT_ID,
        },
        select: transactionSelect,
      });
      expect(transferFindMany).toHaveBeenCalledWith({
        where: {
          OR: [{ accountIdOrigin: ACCOUNT_ID }, { accountIdDestination: ACCOUNT_ID }],
        },
        select: transferSelect,
      });
    });

    it('should query transactions and transfers until the end date', async () => {
      const endDate = new Date('2026-05-31T23:59:59.999Z');

      await query.listTransactionsToEndDate({
        accountId: ACCOUNT_ID,
        effectivated: true,
        endDate,
      });

      expect(transactionFindMany).toHaveBeenCalledWith({
        where: {
          accountId: ACCOUNT_ID,
          effectivated: true,
          dueDate: { lte: endDate },
        },
        select: transactionSelect,
      });
      expect(transferFindMany).toHaveBeenCalledWith({
        where: {
          OR: [{ accountIdOrigin: ACCOUNT_ID }, { accountIdDestination: ACCOUNT_ID }],
          effectivated: true,
          dueDate: { lte: endDate },
        },
        select: transferSelect,
      });
    });

    it('should run both queries in parallel and combine results', async () => {
      transactionFindMany.mockResolvedValue([makeRawTransaction({ amount: 1000 })]);
      transferFindMany.mockResolvedValue([
        makeRawTransfer({ amount: 2000, accountIdOrigin: OTHER_ACCOUNT_ID }),
      ]);

      const result = await query.listTransactions({
        accountId: ACCOUNT_ID,
        period: makePeriod(),
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value).toHaveLength(2);
      expect(result.value[0].movementType).toBe('INCOME');
      expect(result.value[1].movementType).toBe('TRANSFER_IN');
    });
  });

  describe('error handling', () => {
    it('should return PRISMA_QUERY_ERROR when transaction query throws', async () => {
      transactionFindMany.mockRejectedValue(new Error('Connection lost'));

      const result = await query.listTransactions({
        accountId: ACCOUNT_ID,
        period: makePeriod(),
      });

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
      expect(result.errors[0].cls).toBe('PrismaListTransactionsReader');
    });

    it('should return PRISMA_QUERY_ERROR when transfer query throws', async () => {
      transferFindMany.mockRejectedValue(new Error('Timeout'));

      const result = await query.listTransactions({
        accountId: ACCOUNT_ID,
        period: makePeriod(),
      });

      expect(result.isFailure).toBe(true);
      expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
    });
  });
});
