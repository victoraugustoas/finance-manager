import { OutboxEventData } from '@/shared/events/OutboxEvent';

export abstract class EventPublisher {
  abstract publish(event: OutboxEventData): Promise<void>;
}
