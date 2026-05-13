import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { OutboxRepository } from '@/shared/events/ports/OutboxRepository';
import { EventPublisher } from '@/shared/events/ports/EventPublisher';

const RELAY_INTERVAL_MS = 5_000;
const BATCH_SIZE = 100;

@Injectable()
export class OutboxRelayService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(OutboxRelayService.name);
  private intervalHandle: NodeJS.Timeout | undefined;
  private relaying = false;

  constructor(
    private readonly outboxRepository: OutboxRepository,
    private readonly publisher: EventPublisher,
  ) {}

  onApplicationBootstrap(): void {
    this.intervalHandle = setInterval(() => void this.relay(), RELAY_INTERVAL_MS);
  }

  onApplicationShutdown(): void {
    if (this.intervalHandle) clearInterval(this.intervalHandle);
  }

  private async relay(): Promise<void> {
    if (this.relaying) return;
    this.relaying = true;

    try {
      const events = await this.outboxRepository.claimPending(BATCH_SIZE);

      for (const event of events) {
        try {
          await this.publisher.publish(event);
          await this.outboxRepository.markProcessed(event.id);
        } catch (err) {
          this.logger.error(
            `Failed to dispatch event ${event.id} (${event.eventName}): ${String(err)}`,
          );
          await this.outboxRepository.markFailed(event.id, String(err));
        }
      }
    } catch (err) {
      this.logger.error(`Outbox relay error: ${String(err)}`);
    } finally {
      this.relaying = false;
    }
  }
}
