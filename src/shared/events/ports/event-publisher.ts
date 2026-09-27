import { OutboxEventData } from '@/shared/events/outbox-event';

export abstract class EventPublisher {
  abstract publish(event: OutboxEventData): Promise<void>;
}
