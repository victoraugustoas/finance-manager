import { saveWithOutbox } from '@/shared/events/infra/saveWithOutbox';
import { DomainEvent } from '@/shared/base/DomainEvent';
import { OutboxEventStatus } from '@/shared/events/OutboxEvent';
import { PrismaService } from '@/shared/infra/PrismaService';

class TestEvent extends DomainEvent {
  constructor() {
    super();
  }
  get eventName() {
    return 'TestEvent';
  }
  get payload() {
    return { foo: 'bar' };
  }
}

describe('saveWithOutbox', () => {
  let createMany: jest.Mock;
  let operation: jest.Mock;
  let prisma: PrismaService;

  beforeEach(() => {
    createMany = jest.fn().mockResolvedValue(undefined);
    operation = jest.fn().mockResolvedValue(undefined);

    const tx = { outboxEvent: { createMany } };

    prisma = {
      $transaction: jest.fn().mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn(tx)),
    } as unknown as PrismaService;
  });

  it('should call the operation inside the transaction', async () => {
    await saveWithOutbox(prisma, [], operation);

    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should not call createMany when there are no domain events', async () => {
    await saveWithOutbox(prisma, [], operation);

    expect(createMany).not.toHaveBeenCalled();
  });

  it('should create one outbox record per domain event with PENDING status', async () => {
    const event = new TestEvent();

    await saveWithOutbox(prisma, [event], operation);

    expect(createMany).toHaveBeenCalledWith({
      data: [
        {
          id: event.eventId,
          eventName: 'TestEvent',
          payload: { foo: 'bar' },
          occurredAt: event.occurredAt,
          status: OutboxEventStatus.PENDING,
        },
      ],
    });
  });

  it('should create one outbox record per event when multiple events are provided', async () => {
    const events = [new TestEvent(), new TestEvent()];

    await saveWithOutbox(prisma, events, operation);

    const [call] = createMany.mock.calls;
    expect(call[0].data).toHaveLength(2);
    expect(call[0].data[0].id).toBe(events[0].eventId);
    expect(call[0].data[1].id).toBe(events[1].eventId);
  });

  it('should call the operation before creating outbox events', async () => {
    const callOrder: string[] = [];
    operation.mockImplementation(async () => callOrder.push('operation'));
    createMany.mockImplementation(async () => callOrder.push('createMany'));

    await saveWithOutbox(prisma, [new TestEvent()], operation);

    expect(callOrder).toEqual(['operation', 'createMany']);
  });
});
