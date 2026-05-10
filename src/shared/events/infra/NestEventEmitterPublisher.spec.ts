import { NestEventEmitterPublisher } from '@/shared/events/infra/NestEventEmitterPublisher';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OutboxEventData, OutboxEventStatus } from '@/shared/events/OutboxEvent';
import { EventPublisher } from '@/shared/events/ports/EventPublisher';

const makeEvent = (overrides: Partial<OutboxEventData> = {}): OutboxEventData => ({
  id: 'evt-1',
  eventName: 'account.created',
  payload: { accountId: 'acc-1' },
  occurredAt: new Date('2026-01-01'),
  status: OutboxEventStatus.PENDING,
  processedAt: null,
  attempts: 0,
  lastError: null,
  ...overrides,
});

describe('NestEventEmitterPublisher', () => {
  let emitAsync: jest.Mock;
  let emitter: EventEmitter2;
  let publisher: EventPublisher;

  beforeEach(() => {
    emitAsync = jest.fn().mockResolvedValue([]);
    emitter = { emitAsync } as unknown as EventEmitter2;
    publisher = new NestEventEmitterPublisher(emitter);
  });

  describe('publish()', () => {
    it('should call emitAsync with the event name and the full event data', async () => {
      const event = makeEvent();

      await publisher.publish(event);

      expect(emitAsync).toHaveBeenCalledWith('account.created', event);
    });

    it('should call emitAsync exactly once per publish call', async () => {
      await publisher.publish(makeEvent());

      expect(emitAsync).toHaveBeenCalledTimes(1);
    });

    it('should forward the event name from the event data to emitAsync', async () => {
      const event = makeEvent({ eventName: 'transaction.registered' });

      await publisher.publish(event);

      expect(emitAsync).toHaveBeenCalledWith('transaction.registered', event);
    });
  });
});
