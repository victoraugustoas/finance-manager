import { PrismaStatementReader } from '@/reporting/infra/database/readers/PrismaStatementReader';
import { Errors } from '@/shared/base/Errors';
import { PrismaService } from '@/shared/infra/PrismaService';

jest.mock(
  'generated/prisma/client',
  () => ({ TransactionType: { INCOME: 'INCOME', EXPENSE: 'EXPENSE' } }),
  { virtual: true },
);

const ACCOUNT_ID = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const OTHER_ACCOUNT_ID = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const endDate = new Date('2026-06-30T23:59:59.999Z');
const dueDate = new Date('2026-06-16T12:00:00.000Z');

const account = { id: ACCOUNT_ID, name: 'Checking', openingBalance: 1000 };
const otherAccount = { id: OTHER_ACCOUNT_ID, name: 'Savings', openingBalance: 2000 };

describe('PrismaStatementReader', () => {
  let accountFindMany: jest.Mock;
  let transactionFindMany: jest.Mock;
  let transferFindMany: jest.Mock;
  let reader: PrismaStatementReader;

  beforeEach(() => {
    accountFindMany = jest.fn().mockResolvedValue([account]);
    transactionFindMany = jest.fn().mockResolvedValue([]);
    transferFindMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      account: { findMany: accountFindMany },
      transaction: { findMany: transactionFindMany },
      transfer: { findMany: transferFindMany },
    } as unknown as PrismaService;
    reader = new PrismaStatementReader(prisma);
  });

  it('should query selected account transactions and transfers up to the end date', async () => {
    await reader.read({ accountId: ACCOUNT_ID, endDate });

    expect(accountFindMany).toHaveBeenCalledWith({
      where: { id: ACCOUNT_ID },
      select: { id: true, name: true, openingBalance: true },
      orderBy: { name: 'asc' },
    });
    expect(transactionFindMany).toHaveBeenCalledWith({
      where: {
        accountId: { in: [ACCOUNT_ID] },
        dueDate: { lte: endDate },
      },
      select: expect.any(Object),
      orderBy: [{ dueDate: 'asc' }, { name: 'asc' }, { id: 'asc' }],
    });
    expect(transferFindMany).toHaveBeenCalledWith({
      where: {
        OR: [{ accountIdOrigin: ACCOUNT_ID }, { accountIdDestination: ACCOUNT_ID }],
        dueDate: { lte: endDate },
      },
      select: expect.any(Object),
      orderBy: [{ dueDate: 'asc' }, { name: 'asc' }, { id: 'asc' }],
    });
  });

  it('should map incomes, expenses and selected-account transfers with signed balance impacts', async () => {
    transactionFindMany.mockResolvedValue([
      {
        id: 'income-1',
        name: 'Salary',
        amount: 10000,
        notes: null,
        dueDate,
        entryDate: dueDate,
        effectivatedDate: dueDate,
        effectivated: true,
        type: 'INCOME',
        account: { id: ACCOUNT_ID, name: 'Checking' },
        category: { id: 'category-1', name: 'Salary' },
        subCategory: { id: 'subcategory-1', name: 'Monthly salary' },
      },
      {
        id: 'expense-1',
        name: 'Groceries',
        amount: 4500,
        notes: 'market',
        dueDate,
        entryDate: dueDate,
        effectivatedDate: null,
        effectivated: false,
        type: 'EXPENSE',
        account: { id: ACCOUNT_ID, name: 'Checking' },
        category: { id: 'category-2', name: 'Food' },
        subCategory: { id: 'subcategory-2', name: 'Groceries' },
      },
    ]);
    transferFindMany.mockResolvedValue([
      {
        id: 'transfer-out',
        name: 'Savings transfer',
        amount: 2500,
        notes: null,
        dueDate,
        entryDate: dueDate,
        effectivatedDate: null,
        effectivated: false,
        accountIdOrigin: ACCOUNT_ID,
        accountIdDestination: OTHER_ACCOUNT_ID,
        accountOrigin: { id: ACCOUNT_ID, name: 'Checking' },
        accountDestination: { id: OTHER_ACCOUNT_ID, name: 'Savings' },
      },
      {
        id: 'transfer-in',
        name: 'Return transfer',
        amount: 1500,
        notes: null,
        dueDate,
        entryDate: dueDate,
        effectivatedDate: null,
        effectivated: false,
        accountIdOrigin: OTHER_ACCOUNT_ID,
        accountIdDestination: ACCOUNT_ID,
        accountOrigin: { id: OTHER_ACCOUNT_ID, name: 'Savings' },
        accountDestination: { id: ACCOUNT_ID, name: 'Checking' },
      },
    ]);

    const result = await reader.read({ accountId: ACCOUNT_ID, endDate });

    expect(result.isSuccess).toBe(true);
    expect(result.value.accounts[0].openingBalance.amount).toBe(10);
    expect(result.value.movements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'income-1',
          kind: 'INCOME',
          balanceImpactAmount: expect.objectContaining({ amountInCents: 10000 }),
        }),
        expect.objectContaining({
          id: 'expense-1',
          kind: 'EXPENSE',
          balanceImpactAmount: expect.objectContaining({ amountInCents: -4500 }),
        }),
        expect.objectContaining({
          id: 'transfer-out',
          kind: 'TRANSFER',
          balanceImpactAmount: expect.objectContaining({ amountInCents: -2500 }),
        }),
        expect.objectContaining({
          id: 'transfer-in',
          kind: 'TRANSFER',
          balanceImpactAmount: expect.objectContaining({ amountInCents: 1500 }),
        }),
      ]),
    );
  });

  it('should make transfers neutral when all selected accounts include origin and destination', async () => {
    accountFindMany.mockResolvedValue([account, otherAccount]);
    transferFindMany.mockResolvedValue([
      {
        id: 'transfer-1',
        name: 'Internal transfer',
        amount: 2500,
        notes: null,
        dueDate,
        entryDate: dueDate,
        effectivatedDate: null,
        effectivated: false,
        accountIdOrigin: ACCOUNT_ID,
        accountIdDestination: OTHER_ACCOUNT_ID,
        accountOrigin: { id: ACCOUNT_ID, name: 'Checking' },
        accountDestination: { id: OTHER_ACCOUNT_ID, name: 'Savings' },
      },
    ]);

    const result = await reader.read({ endDate });

    expect(result.isSuccess).toBe(true);
    expect(result.value.movements[0].balanceImpactAmount.amountInCents).toBe(0);
    expect(transferFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { accountIdOrigin: { in: [ACCOUNT_ID, OTHER_ACCOUNT_ID] } },
            { accountIdDestination: { in: [ACCOUNT_ID, OTHER_ACCOUNT_ID] } },
          ],
          dueDate: { lte: endDate },
        },
      }),
    );
  });

  it('should return empty statement data when selected account does not exist', async () => {
    accountFindMany.mockResolvedValue([]);

    const result = await reader.read({ accountId: ACCOUNT_ID, endDate });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual({ accounts: [], movements: [] });
    expect(transactionFindMany).not.toHaveBeenCalled();
    expect(transferFindMany).not.toHaveBeenCalled();
  });

  it('should return PRISMA_QUERY_ERROR when prisma throws', async () => {
    accountFindMany.mockRejectedValue(new Error('database down'));

    const result = await reader.read({ endDate });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
    expect(result.errors[0].cls).toBe('PrismaStatementReader');
  });
});
