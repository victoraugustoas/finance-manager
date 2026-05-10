import { EventConsumer } from '@/shared/events/infra/EventConsumer';
import { OutboxEventData, OutboxEventStatus } from '@/shared/events/OutboxEvent';
import { Result } from '@/shared/base';
import { PrismaService } from '@/shared/infra/PrismaService';

interface TestPayload {
  value: string;
}

class TestConsumer extends EventConsumer<TestPayload> {
  callDomain = jest.fn<Promise<Result<void>>, [TestPayload]>();

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  get consumerName(): string {
    return 'TestConsumer';
  }

  restore(event: OutboxEventData): TestPayload {
    return { value: event.payload['value'] as string };
  }
}

const makeEvent = (overrides: Partial<OutboxEventData> = {}): OutboxEventData => ({
  id: 'event-id-1',
  eventName: 'SomeEvent',
  payload: { value: 'hello' },
  occurredAt: new Date('2026-01-01'),
  status: OutboxEventStatus.PENDING,
  processedAt: null,
  attempts: 0,
  lastError: null,
  ...overrides,
});

describe('EventConsumer', () => {
  let createMany: jest.Mock;
  let prisma: PrismaService;
  let consumer: TestConsumer;

  beforeEach(() => {
    createMany = jest.fn();

    const tx = {
      processedEvent: { createMany },
    };

    prisma = {
      $transaction: jest.fn().mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn(tx)),
    } as unknown as PrismaService;

    consumer = new TestConsumer(prisma);
    consumer.callDomain.mockReset();
  });

  describe('consume()', () => {
    it('should insert a processedEvent record with the event id and consumer name', async () => {
      createMany.mockResolvedValue({ count: 1 });
      consumer.callDomain.mockResolvedValue(Result.ok());

      await consumer.consume(makeEvent());

      expect(createMany).toHaveBeenCalledWith({
        data: [{ eventId: 'event-id-1', handler: 'TestConsumer' }],
        skipDuplicates: true,
      });
    });

    it('should call restore() and callDomain() when the event has not been processed yet', async () => {
      createMany.mockResolvedValue({ count: 1 });
      consumer.callDomain.mockResolvedValue(Result.ok());

      await consumer.consume(makeEvent());

      expect(consumer.callDomain).toHaveBeenCalledTimes(1);
      expect(consumer.callDomain).toHaveBeenCalledWith({ value: 'hello' });
    });

    it('should skip restore() and callDomain() when the event is a duplicate (count === 0)', async () => {
      createMany.mockResolvedValue({ count: 0 });

      await consumer.consume(makeEvent());

      expect(consumer.callDomain).not.toHaveBeenCalled();
    });

    it('should throw when callDomain() returns a failure Result', async () => {
      createMany.mockResolvedValue({ count: 1 });
      consumer.callDomain.mockResolvedValue(
        Result.fail({ code: 'GENERIC_ERROR' as any, message: 'domain error' }),
      );

      await expect(consumer.consume(makeEvent())).rejects.toBeDefined();
    });

    it('should not throw when callDomain() returns a successful Result', async () => {
      createMany.mockResolvedValue({ count: 1 });
      consumer.callDomain.mockResolvedValue(Result.ok());

      await expect(consumer.consume(makeEvent())).resolves.toBeUndefined();
    });

    it('should pass the restored payload to callDomain()', async () => {
      createMany.mockResolvedValue({ count: 1 });
      consumer.callDomain.mockResolvedValue(Result.ok());

      const event = makeEvent({ payload: { value: 'custom-value' } });
      await consumer.consume(event);

      expect(consumer.callDomain).toHaveBeenCalledWith({ value: 'custom-value' });
    });
  });
});
