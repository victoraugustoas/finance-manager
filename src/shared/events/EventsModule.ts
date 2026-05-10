import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/shared/infra/PrismaService';
import { OutboxRepository } from '@/shared/events/ports/OutboxRepository';
import { EventPublisher } from '@/shared/events/ports/EventPublisher';
import { PrismaOutboxRepository } from '@/shared/events/infra/PrismaOutboxRepository';
import { NestEventEmitterPublisher } from '@/shared/events/infra/NestEventEmitterPublisher';
import { OutboxRelayService } from '@/shared/events/infra/OutboxRelayService';

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
