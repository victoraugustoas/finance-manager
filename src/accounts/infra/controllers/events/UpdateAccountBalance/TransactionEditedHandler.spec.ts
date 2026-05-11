import { Result } from '@/shared/base';
import { UpdateAccountBalance } from '@/accounts/core/usecases/UpdateAccountBalance';
import { TransactionEditedEvent } from '@/transactions/core/events/TransactionEditedEvent';
import { TransactionType } from '@/transactions/core/model/Transaction';
import { TransactionEditedHandler } from './TransactionEditedHandler';

const makePrisma = (processedCount: number) =>
  ({
    $transaction: jest.fn().mockImplementation((fn: (tx: unknown) => Promise<void>) =>
      fn({
        processedEvent: {
          createMany: jest.fn().mockResolvedValue({ count: processedCount }),
        },
      }),
    ),
  }) as any;

const makeOutboxEvent = (payload: object) => ({
  id: 'event-123',
  eventName: TransactionEditedEvent.EVENT_NAME,
  payload,
});

const basePayload = {
  oldValues: {
    name: 'Salary',
    amount: 100,
    categoryId: 'cat-1',
    subCategoryId: 'sub-1',
    dueDate: new Date(),
    entryDate: new Date(),
    effectivated: true,
    accountId: 'acc-1',
    type: TransactionType.INCOME,
  },
  newValues: {
    name: 'Salary Updated',
    amount: 120,
    categoryId: 'cat-1',
    subCategoryId: 'sub-1',
    dueDate: new Date(),
    entryDate: new Date(),
    effectivated: true,
    accountId: 'acc-1',
    type: TransactionType.INCOME,
  },
};

describe('TransactionEditedHandler', () => {
  let updateAccountBalance: jest.Mocked<UpdateAccountBalance>;

  beforeEach(() => {
    updateAccountBalance = {
      execute: jest.fn().mockResolvedValue(Result.ok(undefined)),
    } as unknown as jest.Mocked<UpdateAccountBalance>;
  });

  it('should call UpdateAccountBalance with EDIT params from payload', async () => {
    const handler = new TransactionEditedHandler(makePrisma(1), updateAccountBalance);
    const event = makeOutboxEvent(basePayload);

    await handler.handle(event as any);

    expect(updateAccountBalance.execute).toHaveBeenCalledWith({
      updatedBy: 'EDIT',
      accountId: basePayload.newValues.accountId,
      oldValue: basePayload.oldValues.amount,
      newValue: basePayload.newValues.amount,
      type: basePayload.newValues.type,
      effectivated: basePayload.newValues.effectivated,
    });
  });

  it('should skip processing when event was already consumed (idempotency)', async () => {
    const handler = new TransactionEditedHandler(makePrisma(0), updateAccountBalance);
    const event = makeOutboxEvent(basePayload);

    await handler.handle(event as any);

    expect(updateAccountBalance.execute).not.toHaveBeenCalled();
  });

  it('should expose correct consumerName for idempotency key', () => {
    const handler = new TransactionEditedHandler(makePrisma(1), updateAccountBalance);
    expect(handler.consumerName).toBe('TransactionEditedHandler');
  });

  it('should restore payload from OutboxEventData', () => {
    const handler = new TransactionEditedHandler(makePrisma(1), updateAccountBalance);
    const event = makeOutboxEvent(basePayload);
    const restored = handler.restore(event as any);
    expect(restored).toEqual(basePayload);
  });
});
