import { DomainEvent } from '@/shared/events/domain-event';
import { OutboxEventData } from '@/shared/events/outbox-event';
import { TransactionType } from '@/shared/enums/transaction-type';
import { TransactionProps } from './transaction.entity';

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
