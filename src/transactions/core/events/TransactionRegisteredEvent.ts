import { DomainEvent } from '@/shared/base/DomainEvent';
import { OutboxEventData } from '@/shared/events/OutboxEvent';
import { TransactionType } from '@/transactions/core/model/Transaction';

export interface TransactionRegisteredPayload {
  transactionId: string;
  type: TransactionType;
  amountInCents: number;
  accountId: string;
  categoryId: string;
  subCategoryId: string;
  effectivated: boolean;
}

export class TransactionRegisteredEvent extends DomainEvent {
  static readonly EVENT_NAME = 'transaction.registered';

  constructor(private readonly data: TransactionRegisteredPayload) {
    super();
  }

  get eventName(): string {
    return TransactionRegisteredEvent.EVENT_NAME;
  }

  get payload(): Record<string, unknown> {
    return { ...this.data };
  }

  static fromOutbox(event: OutboxEventData): TransactionRegisteredPayload {
    return event.payload as unknown as TransactionRegisteredPayload;
  }
}
