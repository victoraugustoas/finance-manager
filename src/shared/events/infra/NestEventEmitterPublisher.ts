import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventPublisher } from '@/shared/events/ports/EventPublisher';
import { OutboxEventData } from '@/shared/events/OutboxEvent';

@Injectable()
export class NestEventEmitterPublisher implements EventPublisher {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async publish(event: OutboxEventData): Promise<void> {
    await this.eventEmitter.emitAsync(event.eventName, event);
  }
}
