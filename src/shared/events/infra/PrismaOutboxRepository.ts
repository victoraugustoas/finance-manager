import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/infra/PrismaService';
import { OutboxRepository } from '@/shared/events/ports/OutboxRepository';
import { OutboxEventData, OutboxEventStatus } from '@/shared/events/OutboxEvent';

@Injectable()
export class PrismaOutboxRepository extends OutboxRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async claimPending(limit = 100): Promise<OutboxEventData[]> {
    return this.prisma.$transaction(async (tx) => {
      const pending = await tx.outboxEvent.findMany({
        where: { status: OutboxEventStatus.PENDING },
        orderBy: { createdAt: 'asc' },
        take: limit,
      });

      if (pending.length === 0) return [];

      await tx.outboxEvent.updateMany({
        where: { id: { in: pending.map((e) => e.id) }, status: OutboxEventStatus.PENDING },
        data: { status: OutboxEventStatus.PROCESSING },
      });

      return pending.map(this.toData);
    });
  }

  async markProcessed(id: string): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id },
      data: { status: OutboxEventStatus.PROCESSED, processedAt: new Date() },
    });
  }

  async markFailed(id: string, error: string): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id },
      data: {
        status: OutboxEventStatus.FAILED,
        lastError: error,
        attempts: { increment: 1 },
      },
    });
  }

  private toData(event: {
    id: string;
    eventName: string;
    payload: unknown;
    occurredAt: Date;
    status: string;
    processedAt: Date | null;
    attempts: number;
    lastError: string | null;
  }): OutboxEventData {
    return {
      id: event.id,
      eventName: event.eventName,
      payload: event.payload as Record<string, unknown>,
      occurredAt: event.occurredAt,
      status: event.status as OutboxEventStatus,
      processedAt: event.processedAt,
      attempts: event.attempts,
      lastError: event.lastError,
    };
  }
}
