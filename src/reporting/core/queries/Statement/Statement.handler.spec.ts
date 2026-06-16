import { StatementReader } from '@/reporting/core/ports/readers/StatementReader';
import { StatementHandler } from '@/reporting/core/queries/Statement/Statement.handler';
import { Result } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';
import { Money } from '@/shared/ValueObjects';
import { endOfDay, startOfDay } from 'date-fns';

const account = {
  id: 'account-1',
  name: 'Checking',
  openingBalance: Money.new(10),
};

const movement = (props: {
  id: string;
  kind: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  balanceImpact: number;
  dueDate: string;
  effectivated: boolean;
}) => ({
  id: props.id,
  kind: props.kind,
  name: props.id,
  amount: Money.new(props.amount),
  dueDate: new Date(props.dueDate),
  entryDate: new Date('2026-06-01T09:00:00.000Z'),
  effectivated: props.effectivated,
  effectivatedDate: props.effectivated ? new Date(props.dueDate) : null,
  notes: null,
  account: { id: account.id, name: account.name },
  balanceImpactAmount: Money.new(props.balanceImpact),
});

describe('StatementHandler', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-16T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should generate statement days ordered by due date and ignore non-effectivated past movements in balances', async () => {
    const reader = {
      read: jest.fn().mockResolvedValue(
        Result.ok({
          accounts: [account],
          movements: [
            movement({
              id: 'previous-effectivated-income',
              kind: 'INCOME',
              amount: 5,
              balanceImpact: 5,
              dueDate: '2026-06-02T12:00:00.000Z',
              effectivated: true,
            }),
            movement({
              id: 'past-pending-expense',
              kind: 'EXPENSE',
              amount: 2,
              balanceImpact: -2,
              dueDate: '2026-06-10T12:00:00.000Z',
              effectivated: false,
            }),
            movement({
              id: 'past-effectivated-expense',
              kind: 'EXPENSE',
              amount: 4,
              balanceImpact: -4,
              dueDate: '2026-06-10T13:00:00.000Z',
              effectivated: true,
            }),
          ],
        }),
      ),
    } as unknown as StatementReader;
    const handler = new StatementHandler(reader);

    const result = await handler.handle({
      startDate: new Date('2026-06-05T00:00:00.000Z'),
      endDate: new Date('2026-06-12T23:59:59.000Z'),
      accountId: account.id,
    });

    expect(result.isSuccess).toBe(true);
    expect(reader.read).toHaveBeenCalledWith({
      accountId: account.id,
      endDate: endOfDay(new Date('2026-06-12T23:59:59.000Z')),
    });
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
  });

  it('should include today pending movements and carry the projected balance to future days', async () => {
    const reader = {
      read: jest.fn().mockResolvedValue(
        Result.ok({
          accounts: [account],
          movements: [
            movement({
              id: 'today-pending-expense',
              kind: 'EXPENSE',
              amount: 4,
              balanceImpact: -4,
              dueDate: '2026-06-16T12:00:00.000Z',
              effectivated: false,
            }),
            movement({
              id: 'future-pending-income',
              kind: 'INCOME',
              amount: 8,
              balanceImpact: 8,
              dueDate: '2026-06-18T12:00:00.000Z',
              effectivated: false,
            }),
          ],
        }),
      ),
    } as unknown as StatementReader;
    const handler = new StatementHandler(reader);

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

  it('should carry projected movements between today and start date when statement starts in the future', async () => {
    const reader = {
      read: jest.fn().mockResolvedValue(
        Result.ok({
          accounts: [account],
          movements: [
            movement({
              id: 'today-pending-expense',
              kind: 'EXPENSE',
              amount: 4,
              balanceImpact: -4,
              dueDate: '2026-06-16T12:00:00.000Z',
              effectivated: false,
            }),
            movement({
              id: 'statement-expense',
              kind: 'EXPENSE',
              amount: 2,
              balanceImpact: -2,
              dueDate: '2026-06-18T12:00:00.000Z',
              effectivated: false,
            }),
          ],
        }),
      ),
    } as unknown as StatementReader;
    const handler = new StatementHandler(reader);

    const result = await handler.handle({
      startDate: new Date('2026-06-18T00:00:00.000Z'),
      endDate: new Date('2026-06-18T23:59:59.000Z'),
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.initialBalance.amount).toBe(6);
    expect(result.value.days[0].balance.amount).toBe(4);
  });

  it('should propagate reader failures', async () => {
    const reader = {
      read: jest.fn().mockResolvedValue(
        Result.fail({
          code: Errors.PRISMA_QUERY_ERROR,
          cls: 'test',
        }),
      ),
    } as unknown as StatementReader;
    const handler = new StatementHandler(reader);

    const result = await handler.handle({
      startDate: new Date('2026-06-01T00:00:00.000Z'),
      endDate: new Date('2026-06-30T23:59:59.999Z'),
    });

    expect(result.isFailure).toBe(true);
    expect(result.errors[0].code).toBe(Errors.PRISMA_QUERY_ERROR);
  });
});
