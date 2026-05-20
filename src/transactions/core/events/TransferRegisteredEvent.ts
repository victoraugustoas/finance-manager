import { DomainEvent } from '@/shared/base';
import { OutboxEventData } from '@/shared/events/OutboxEvent';

export interface TransferRegisteredPayload {
  transactionId: string;
  amountInCents: number;
  accountIdOrigin: string;
  accountIdDestination: string;
  effectivated: boolean;
}

export class TransferRegisteredEvent extends DomainEvent {
  static readonly EVENT_NAME = 'transfer.registered';

  constructor(private readonly data: TransferRegisteredPayload) {
    super();
  }

  get eventName(): string {
    return TransferRegisteredEvent.EVENT_NAME;
  }

  get payload(): Record<string, unknown> {
    return { ...this.data };
  }

  static fromOutbox(event: OutboxEventData): TransferRegisteredPayload {
    return event.payload as unknown as TransferRegisteredPayload;
  }
}
