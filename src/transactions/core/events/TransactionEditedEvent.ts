import { DomainEvent } from '@/shared/base/DomainEvent';
import { OutboxEventData } from '@/shared/events/OutboxEvent';
import { TransactionProps } from '@/transactions/core/model/Transaction';

export interface TransactionEditedPayload {
  oldValues: Omit<TransactionProps, 'id'>;
  newValues: Omit<TransactionProps, 'id'>;
}

export class TransactionEditedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'transaction.edited';

  constructor(private readonly data: TransactionEditedPayload) {
    super();
  }

  get eventName(): string {
    return TransactionEditedEvent.EVENT_NAME;
  }

  get payload(): Record<string, unknown> {
    return { ...this.data };
  }

  static fromOutbox(event: OutboxEventData): TransactionEditedPayload {
    return event.payload as unknown as TransactionEditedPayload;
  }
}
