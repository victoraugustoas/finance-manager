import { OutboxEventData } from '@/shared/events/OutboxEvent';

export abstract class OutboxRepository {
  abstract claimPending(limit?: number): Promise<OutboxEventData[]>;
  abstract markProcessed(id: string): Promise<void>;
  abstract markFailed(id: string, error: string): Promise<void>;
}
