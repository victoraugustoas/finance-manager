import { ListAccountsReader } from '@/reporting/core/ports/readers/ListAccountsReader';
import {
  ListTransactionsReader,
  ListTransactionsReaderResult,
  TransactionMovementType,
} from '@/reporting/core/ports/readers/ListTransactionsReader';
import { StatementHandler } from '@/reporting/core/queries/Statement/Statement.handler';
import { AccountBalanceCalculatorService } from '@/reporting/core/service/AccountBalanceCalculator/AccountBalanceCalculator.service';
import { Result } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';
import { Money } from '@/shared/ValueObjects';
import { endOfDay, startOfDay } from 'date-fns';

const account = {
  id: 'account-1',
  name: 'Checking',
  openingBalance: Money.new(10),
};

const savingsAccount = {
  id: 'account-2',
  name: 'Savings',
  openingBalance: Money.new(20),
};

const accountReference = { id: account.id, name: account.name };

const movement = (props: {
  id: string;
  movementType: TransactionMovementType;
  amount: number;
  dueDate: string;
  effectivated: boolean;
  account?: { id: string; name: string };
  originAccount?: { id: string; name: string };
  destinationAccount?: { id: string; name: string };
}): ListTransactionsReaderResult => ({
  id: props.id,
  movementType: props.movementType,
  name: props.id,
  amount: Money.new(props.amount),
  dueDate: new Date(props.dueDate),
  entryDate: new Date('2026-06-01T09:00:00.000Z'),
  effectivated: props.effectivated,
  effectivatedDate: props.effectivated ? new Date(props.dueDate) : null,
  notes: null,
  account: 'account' in props ? props.account : accountReference,
  originAccount: props.originAccount,
  destinationAccount: props.destinationAccount,
});

const applyMovement = (balance: Money, transaction: ListTransactionsReaderResult): Money =>
  transaction.movementType === 'INCOME' || transaction.movementType === 'TRANSFER_IN'
    ? balance.add(transaction.amount)
    : balance.subtract(transaction.amount);

const makeAccountBalanceCalculator = (balances: Money[]): AccountBalanceCalculatorService =>
  ({
    calculate: jest.fn().mockImplementation(() => {
      const balance = balances.shift() ?? Money.new(0);
      return Promise.resolve(Result.ok({ balance, estimatedBalance: balance }));
    }),
    accountBalanceCalculator: jest.fn(applyMovement),
  }) as unknown as AccountBalanceCalculatorService;

describe('StatementHandler', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-16T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should generate statement days ordered by due date and ignore non-effectivated past movements in balances', async () => {
    const movements = [
      movement({
        id: 'past-pending-expense',
        movementType: 'EXPENSE',
        amount: 2,
        dueDate: '2026-06-10T12:00:00.000Z',
        effectivated: false,
      }),
      movement({
        id: 'past-effectivated-expense',
        movementType: 'EXPENSE',
        amount: 4,
        dueDate: '2026-06-10T13:00:00.000Z',
        effectivated: true,
      }),
    ];
    const listAccountsReader = {
      read: jest.fn().mockResolvedValue(Result.ok([account])),
    } as unknown as ListAccountsReader;
    const listTransactionsReader = {
      listTransactions: jest.fn().mockResolvedValue(Result.ok(movements)),
      listTransactionsToEndDate: jest.fn(),
    } as unknown as ListTransactionsReader;
    const accountBalanceCalculator = makeAccountBalanceCalculator([Money.new(15)]);
    const handler = new StatementHandler(
      listTransactionsReader,
      listAccountsReader,
      accountBalanceCalculator,
    );

    const result = await handler.handle({
      startDate: new Date('2026-06-05T00:00:00.000Z'),
      endDate: new Date('2026-06-12T23:59:59.000Z'),
      accountId: account.id,
    });

    expect(result.isSuccess).toBe(true);
    expect(listAccountsReader.read).toHaveBeenCalledTimes(1);
    expect(accountBalanceCalculator.calculate).toHaveBeenCalledWith({
      accountId: account.id,
      endDate: endOfDay(new Date('2026-06-12T23:59:59.000Z')),
    });
    expect(listTransactionsReader.listTransactions).toHaveBeenCalledTimes(1);
    expect(listTransactionsReader.listTransactions).toHaveBeenCalledWith({
      accountId: account.id,
      period: expect.objectContaining({}),
    });
    const period = jest.mocked(listTransactionsReader.listTransactions).mock.calls[0][0].period!;
    expect(period.startDate).toEqual(startOfDay(new Date('2026-06-05T00:00:00.000Z')));
    expect(period.endDate).toEqual(endOfDay(new Date('2026-06-12T23:59:59.000Z')));
    expect(result.value.initialBalance.amount).toBe(15);
    expect(result.value.days).toHaveLength(1);
    expect(result.value.days[0].date).toEqual(startOfDay(new Date('2026-06-10T12:00:00.000Z')));
    expect(result.value.days[0].balance.amount).toBe(11);
    expect(result.value.finalBalance.amount).toBe(11);
    expect(result.value.days[0].entries.map((entry) => entry.id)).toEqual([
      'past-pending-expense',
      'past-effectivated-expense',
    ]);
    expect(result.value.days[0].entries[0].includedInBalance).toBe(false);
    expect(result.value.days[0].entries[1].includedInBalance).toBe(true);
    expect(result.value.days[0].entries[1].balanceImpact).toEqual({
      direction: 'OUT',
      amount: Money.new(4),
    });
  });

  it('should include today pending movements and carry the projected balance to future days', async () => {
    const listAccountsReader = {
      read: jest.fn().mockResolvedValue(Result.ok([account])),
    } as unknown as ListAccountsReader;
    const listTransactionsReader = {
      listTransactions: jest.fn().mockResolvedValue(
        Result.ok([
          movement({
            id: 'today-pending-expense',
            movementType: 'EXPENSE',
            amount: 4,
            dueDate: '2026-06-16T12:00:00.000Z',
            effectivated: false,
          }),
          movement({
            id: 'future-pending-income',
            movementType: 'INCOME',
            amount: 8,
            dueDate: '2026-06-18T12:00:00.000Z',
            effectivated: false,
          }),
        ]),
      ),
      listTransactionsToEndDate: jest.fn(),
    } as unknown as ListTransactionsReader;
    const accountBalanceCalculator = makeAccountBalanceCalculator([Money.new(10)]);
    const handler = new StatementHandler(
      listTransactionsReader,
      listAccountsReader,
      accountBalanceCalculator,
    );

    const result = await handler.handle({
      startDate: new Date('2026-06-16T00:00:00.000Z'),
      endDate: new Date('2026-06-18T23:59:59.000Z'),
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.initialBalance.amount).toBe(10);
    expect(result.value.days.map((day) => day.balance.amount)).toEqual([6, 14]);
    expect(result.value.days[0].entries[0].includedInBalance).toBe(true);
    expect(result.value.days[1].entries[0].includedInBalance).toBe(true);
    expect(result.value.finalBalance.amount).toBe(14);
  });

  it('should combine accounts and order movements globally by due date and name', async () => {
    const listAccountsReader = {
      read: jest.fn().mockResolvedValue(Result.ok([account, savingsAccount])),
    } as unknown as ListAccountsReader;
    const listTransactionsReader = {
      listTransactions: jest
        .fn()
        .mockResolvedValueOnce(
          Result.ok([
            movement({
              id: 'z-expense',
              movementType: 'EXPENSE',
              amount: 1,
              dueDate: '2026-06-17T12:00:00.000Z',
              effectivated: false,
              account: accountReference,
            }),
          ]),
        )
        .mockResolvedValueOnce(
          Result.ok([
            movement({
              id: 'a-income',
              movementType: 'INCOME',
              amount: 2,
              dueDate: '2026-06-17T12:00:00.000Z',
              effectivated: false,
              account: { id: savingsAccount.id, name: savingsAccount.name },
            }),
          ]),
        ),
      listTransactionsToEndDate: jest.fn(),
    } as unknown as ListTransactionsReader;
    const accountBalanceCalculator = makeAccountBalanceCalculator([Money.new(10), Money.new(20)]);
    const handler = new StatementHandler(
      listTransactionsReader,
      listAccountsReader,
      accountBalanceCalculator,
    );

    const result = await handler.handle({
      startDate: new Date('2026-06-17T00:00:00.000Z'),
      endDate: new Date('2026-06-17T23:59:59.000Z'),
    });

    expect(result.isSuccess).toBe(true);
    expect(accountBalanceCalculator.calculate).toHaveBeenCalledTimes(2);
    expect(listTransactionsReader.listTransactions).toHaveBeenCalledTimes(2);
    expect(result.value.initialBalance.amount).toBe(30);
    expect(result.value.days[0].entries.map((entry) => entry.id)).toEqual([
      'a-income',
      'z-expense',
    ]);
    expect(result.value.finalBalance.amount).toBe(31);
  });

  it('should use only the selected account when accountId is provided', async () => {
    const savingsMovement = movement({
      id: 'savings-income',
      movementType: 'INCOME',
      amount: 7,
      dueDate: '2026-06-17T12:00:00.000Z',
      effectivated: false,
      account: { id: savingsAccount.id, name: savingsAccount.name },
    });
    const listAccountsReader = {
      read: jest.fn().mockResolvedValue(Result.ok([account, savingsAccount])),
    } as unknown as ListAccountsReader;
    const listTransactionsReader = {
      listTransactions: jest.fn().mockResolvedValue(Result.ok([savingsMovement])),
      listTransactionsToEndDate: jest.fn(),
    } as unknown as ListTransactionsReader;
    const accountBalanceCalculator = makeAccountBalanceCalculator([Money.new(20)]);
    const handler = new StatementHandler(
      listTransactionsReader,
      listAccountsReader,
      accountBalanceCalculator,
    );

    const result = await handler.handle({
      startDate: new Date('2026-06-17T00:00:00.000Z'),
      endDate: new Date('2026-06-17T23:59:59.000Z'),
      accountId: savingsAccount.id,
    });

    expect(result.isSuccess).toBe(true);
    expect(accountBalanceCalculator.calculate).toHaveBeenCalledTimes(1);
    expect(accountBalanceCalculator.calculate).toHaveBeenCalledWith({
      accountId: savingsAccount.id,
      endDate: endOfDay(new Date('2026-06-17T23:59:59.000Z')),
    });
    expect(listTransactionsReader.listTransactions).toHaveBeenCalledTimes(1);
    expect(listTransactionsReader.listTransactions).toHaveBeenCalledWith({
      accountId: savingsAccount.id,
      period: expect.objectContaining({}),
    });
    expect(result.value.accountId).toBe(savingsAccount.id);
    expect(result.value.initialBalance.amount).toBe(20);
    expect(result.value.days[0].entries.map((entry) => entry.id)).toEqual(['savings-income']);
    expect(result.value.finalBalance.amount).toBe(27);
  });

  it('should fail when selected account does not exist', async () => {
    const listAccountsReader = {
      read: jest.fn().mockResolvedValue(Result.ok([account, savingsAccount])),
    } as unknown as ListAccountsReader;
    const listTransactionsReader = {
      listTransactions: jest.fn(),
      listTransactionsToEndDate: jest.fn(),
    } as unknown as ListTransactionsReader;
    const accountBalanceCalculator = makeAccountBalanceCalculator([]);
    const handler = new StatementHandler(
      listTransactionsReader,
      listAccountsReader,
      accountBalanceCalculator,
    );

    const result = await handler.handle({
      startDate: new Date('2026-06-17T00:00:00.000Z'),
      endDate: new Date('2026-06-17T23:59:59.000Z'),
      accountId: 'missing-account',
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0]).toMatchObject({
      code: Errors.REFERENCE_ACCOUNT_NOT_FOUND,
      cls: 'StatementHandler',
      data: { accountId: 'missing-account' },
    });
    expect(accountBalanceCalculator.calculate).not.toHaveBeenCalled();
    expect(listTransactionsReader.listTransactions).not.toHaveBeenCalled();
  });

  it('should expose transfers as TRANSFER and deduplicate the same transfer between accounts', async () => {
    const originAccount = { id: account.id, name: account.name };
    const destinationAccount = { id: savingsAccount.id, name: savingsAccount.name };
    const transferOut = movement({
      id: 'transfer-1',
      movementType: 'TRANSFER_OUT',
      amount: 5,
      dueDate: '2026-06-17T12:00:00.000Z',
      effectivated: false,
      account: undefined,
      originAccount,
      destinationAccount,
    });
    const transferIn = movement({
      id: 'transfer-1',
      movementType: 'TRANSFER_IN',
      amount: 5,
      dueDate: '2026-06-17T12:00:00.000Z',
      effectivated: false,
      account: undefined,
      originAccount,
      destinationAccount,
    });
    const listAccountsReader = {
      read: jest.fn().mockResolvedValue(Result.ok([account, savingsAccount])),
    } as unknown as ListAccountsReader;
    const listTransactionsReader = {
      listTransactions: jest
        .fn()
        .mockResolvedValueOnce(Result.ok([transferOut]))
        .mockResolvedValueOnce(Result.ok([transferIn])),
      listTransactionsToEndDate: jest.fn(),
    } as unknown as ListTransactionsReader;
    const accountBalanceCalculator = makeAccountBalanceCalculator([Money.new(10), Money.new(20)]);
    const handler = new StatementHandler(
      listTransactionsReader,
      listAccountsReader,
      accountBalanceCalculator,
    );

    const result = await handler.handle({
      startDate: new Date('2026-06-17T00:00:00.000Z'),
      endDate: new Date('2026-06-17T23:59:59.000Z'),
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.initialBalance.amount).toBe(30);
    expect(result.value.days[0].entries).toHaveLength(1);
    expect(result.value.days[0].entries[0]).toMatchObject({
      id: 'transfer-1',
      movementType: 'TRANSFER',
      originAccount,
      destinationAccount,
      balanceImpact: { direction: 'NEUTRAL', amount: Money.new(5) },
      includedInBalance: true,
    });
    expect(result.value.days[0].balance.amount).toBe(30);
    expect(result.value.finalBalance.amount).toBe(30);
    expect(accountBalanceCalculator.accountBalanceCalculator).toHaveBeenCalledWith(
      expect.any(Money),
      transferOut,
    );
    expect(accountBalanceCalculator.accountBalanceCalculator).toHaveBeenCalledWith(
      expect.any(Money),
      transferIn,
    );
  });

  it('should propagate account reader failures', async () => {
    const listAccountsReader = {
      read: jest.fn().mockResolvedValue(
        Result.fail({
          code: Errors.PRISMA_QUERY_ERROR,
          cls: 'test',
        }),
      ),
    } as unknown as ListAccountsReader;
    const listTransactionsReader = {
      listTransactions: jest.fn(),
      listTransactionsToEndDate: jest.fn(),
    } as unknown as ListTransactionsReader;
    const accountBalanceCalculator = makeAccountBalanceCalculator([]);
    const handler = new StatementHandler(
      listTransactionsReader,
      listAccountsReader,
      accountBalanceCalculator,
    );

    const result = await handler.handle({
      startDate: new Date('2026-06-01T00:00:00.000Z'),
      endDate: new Date('2026-06-30T23:59:59.999Z'),
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
    expect(accountBalanceCalculator.calculate).not.toHaveBeenCalled();
    expect(listTransactionsReader.listTransactions).not.toHaveBeenCalled();
  });

  it('should propagate balance calculation failures', async () => {
    const listAccountsReader = {
      read: jest.fn().mockResolvedValue(Result.ok([account])),
    } as unknown as ListAccountsReader;
    const listTransactionsReader = {
      listTransactions: jest.fn(),
      listTransactionsToEndDate: jest.fn(),
    } as unknown as ListTransactionsReader;
    const accountBalanceCalculator = {
      calculate: jest.fn().mockResolvedValue(
        Result.fail({
          code: Errors.PRISMA_QUERY_ERROR,
          cls: 'test',
        }),
      ),
      accountBalanceCalculator: jest.fn(),
    } as unknown as AccountBalanceCalculatorService;
    const handler = new StatementHandler(
      listTransactionsReader,
      listAccountsReader,
      accountBalanceCalculator,
    );

    const result = await handler.handle({
      startDate: new Date('2026-06-01T00:00:00.000Z'),
      endDate: new Date('2026-06-30T23:59:59.999Z'),
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
    expect(listTransactionsReader.listTransactions).not.toHaveBeenCalled();
  });

  it('should propagate transaction reader failures', async () => {
    const listAccountsReader = {
      read: jest.fn().mockResolvedValue(Result.ok([account])),
    } as unknown as ListAccountsReader;
    const listTransactionsReader = {
      listTransactions: jest.fn().mockResolvedValue(
        Result.fail({
          code: Errors.PRISMA_QUERY_ERROR,
          cls: 'test',
        }),
      ),
      listTransactionsToEndDate: jest.fn(),
    } as unknown as ListTransactionsReader;
    const accountBalanceCalculator = makeAccountBalanceCalculator([Money.new(10)]);
    const handler = new StatementHandler(
      listTransactionsReader,
      listAccountsReader,
      accountBalanceCalculator,
    );

    const result = await handler.handle({
      startDate: new Date('2026-06-01T00:00:00.000Z'),
      endDate: new Date('2026-06-30T23:59:59.999Z'),
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
  });
});
