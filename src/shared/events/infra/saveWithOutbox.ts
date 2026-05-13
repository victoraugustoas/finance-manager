import { PrismaService } from '@/shared/infra/PrismaService';
import { Prisma } from 'generated/prisma/client';
import { DomainEvent } from '@/shared/base/DomainEvent';
import { OutboxEventStatus } from '@/shared/events/OutboxEvent';

type PrismaTxClient = Omit<
  PrismaService,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export async function saveWithOutbox(
  prisma: PrismaService,
  events: ReadonlyArray<DomainEvent>,
  operation: (tx: PrismaTxClient) => Promise<void>,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await operation(tx as PrismaTxClient);

    if (events.length > 0) {
      await (tx as PrismaTxClient).outboxEvent.createMany({
        data: events.map((e) => ({
          id: e.eventId,
          eventName: e.eventName,
          payload: e.payload as Prisma.InputJsonValue,
          occurredAt: e.occurredAt,
          status: OutboxEventStatus.PENDING,
        })),
      });
    }
  });
}
