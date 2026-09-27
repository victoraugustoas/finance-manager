import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventPublisher } from '@/shared/events/ports/event-publisher';
import { OutboxEventData } from '@/shared/events/outbox-event';

@Injectable()
export class NestEventEmitterPublisher implements EventPublisher {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async publish(event: OutboxEventData): Promise<void> {
    await this.eventEmitter.emitAsync(event.eventName, event);
  }
}
