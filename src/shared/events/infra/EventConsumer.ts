import { PrismaService } from '@/shared/infra/PrismaService';
import { OutboxEventData } from '@/shared/events/OutboxEvent';
import { Result } from '@/shared/base';

export abstract class EventConsumer<TPayload extends object> {
  protected constructor(private readonly prisma: PrismaService) {}

  abstract get consumerName(): string;

  abstract restore(event: OutboxEventData): TPayload;

  abstract callDomain(payload: TPayload): Promise<Result<void>>;

  async consume(event: OutboxEventData): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.processedEvent.createMany({
        data: [{ eventId: event.id, handler: this.consumerName }],
        skipDuplicates: true,
      });

      if (count === 0) return;

      const payload = this.restore(event);
      const result = await this.callDomain(payload);
      result.throwIfError();
    });
  }
}
