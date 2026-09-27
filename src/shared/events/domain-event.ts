import { randomUUID } from 'crypto';

export abstract class DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;

  protected constructor() {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }

  abstract get eventName(): string;
  abstract get payload(): Record<string, unknown>;
}
