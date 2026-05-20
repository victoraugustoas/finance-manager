import { EventConsumer } from '@/shared/events/infra/EventConsumer';
import { OutboxEventData } from '@/shared/events/OutboxEvent';
import { PrismaService } from '@/shared/infra/PrismaService';
import { Result } from '@/shared/base';
import { ApplyTransferBetweenAccountsUseCase } from '@/accounts/core/usecases/ApplyTransferBetweenAccounts.usecase';
import {
  TransferRegisteredEvent,
  TransferRegisteredPayload,
} from '@/transactions/core/events/TransferRegisteredEvent';
import { OnEvent } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TransferRegisteredHandler extends EventConsumer<TransferRegisteredPayload> {
  constructor(
    prisma: PrismaService,
    private readonly applyTransferBetweenAccountsUseCase: ApplyTransferBetweenAccountsUseCase,
  ) {
    super(prisma);
  }

  get consumerName(): string {
    return 'TransferRegisteredHandler';
  }

  callDomain(payload: TransferRegisteredPayload): Promise<Result<void>> {
    return this.applyTransferBetweenAccountsUseCase.execute({
      accountIdOrigin: payload.accountIdOrigin,
      accountIdDestination: payload.accountIdDestination,
      amount: payload.amountInCents,
      effectivated: payload.effectivated,
    });
  }

  restore(event: OutboxEventData): TransferRegisteredPayload {
    return TransferRegisteredEvent.fromOutbox(event);
  }

  @OnEvent(TransferRegisteredEvent.EVENT_NAME)
  async handle(event: OutboxEventData): Promise<void> {
    await this.consume(event);
  }
}
