export enum OutboxEventStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

export interface OutboxEventData {
  id: string;
  eventName: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
  status: OutboxEventStatus;
  processedAt: Date | null;
  attempts: number;
  lastError: string | null;
}
