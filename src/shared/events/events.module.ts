import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/shared/infra/prisma.service';
import { OutboxRepository } from '@/shared/events/ports/outbox-repository';
import { EventPublisher } from '@/shared/events/ports/event-publisher';
import { PrismaOutboxRepository } from '@/shared/events/infra/prisma-outbox.repository';
import { NestEventEmitterPublisher } from '@/shared/events/infra/nest-event-emitter-publisher';
import { OutboxRelayService } from '@/shared/events/infra/outbox-relay.service';

@Module({
  imports: [EventEmitterModule.forRoot({ wildcard: false })],
  providers: [
    PrismaService,
    {
      provide: OutboxRepository,
      useFactory: (prisma: PrismaService) => new PrismaOutboxRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: EventPublisher,
      useFactory: (emitter: EventEmitter2) => new NestEventEmitterPublisher(emitter),
      inject: [EventEmitter2],
    },
    OutboxRelayService,
  ],
  exports: [EventPublisher],
})
export class EventsModule {}
