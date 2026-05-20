import { Result } from '@/shared/base';
import { ApplyTransferBetweenAccountsUseCase } from '@/accounts/core/usecases/ApplyTransferBetweenAccounts.usecase';
import { TransferRegisteredEvent } from '@/transactions/core/events/TransferRegisteredEvent';
import { TransferRegisteredHandler } from './TransferRegisteredHandler';

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
  id: 'event-456',
  eventName: TransferRegisteredEvent.EVENT_NAME,
  payload,
});

const basePayload = {
  transactionId: 'tx-1',
  amountInCents: 500,
  accountIdOrigin: 'acc-origin',
  accountIdDestination: 'acc-destination',
  effectivated: true,
};

describe('TransferRegisteredHandler', () => {
  let applyTransfer: jest.Mocked<ApplyTransferBetweenAccountsUseCase>;

  beforeEach(() => {
    applyTransfer = {
      execute: jest.fn().mockResolvedValue(Result.ok(undefined)),
    } as unknown as jest.Mocked<ApplyTransferBetweenAccountsUseCase>;
  });

  it('should call ApplyTransferBetweenAccountsUseCase with correctly mapped params', async () => {
    const handler = new TransferRegisteredHandler(makePrisma(1), applyTransfer);
    const event = makeOutboxEvent(basePayload);

    await handler.handle(event as any);

    expect(applyTransfer.execute).toHaveBeenCalledWith({
      accountIdOrigin: basePayload.accountIdOrigin,
      accountIdDestination: basePayload.accountIdDestination,
      amount: basePayload.amountInCents,
      effectivated: basePayload.effectivated,
    });
  });

  it('should forward effectivated: false to the use case', async () => {
    const handler = new TransferRegisteredHandler(makePrisma(1), applyTransfer);
    const event = makeOutboxEvent({ ...basePayload, effectivated: false });

    await handler.handle(event as any);

    expect(applyTransfer.execute).toHaveBeenCalledWith(
      expect.objectContaining({ effectivated: false }),
    );
  });

  it('should skip processing when event was already consumed (idempotency)', async () => {
    const handler = new TransferRegisteredHandler(makePrisma(0), applyTransfer);
    const event = makeOutboxEvent(basePayload);

    await handler.handle(event as any);

    expect(applyTransfer.execute).not.toHaveBeenCalled();
  });

  it('should expose correct consumerName for idempotency key', () => {
    const handler = new TransferRegisteredHandler(makePrisma(1), applyTransfer);
    expect(handler.consumerName).toBe('TransferRegisteredHandler');
  });

  it('should restore payload from OutboxEventData', () => {
    const handler = new TransferRegisteredHandler(makePrisma(1), applyTransfer);
    const event = makeOutboxEvent(basePayload);
    const restored = handler.restore(event as any);
    expect(restored).toEqual(basePayload);
  });
});
