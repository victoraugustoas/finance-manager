import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from 'src/shared/infra/PrismaService';
import { OutboxEventData } from 'src/shared/events/OutboxEvent';
import { EventConsumer } from 'src/shared/events/infra/EventConsumer';
import { Result } from 'src/shared/base';
import { UpdateAccountBalance } from 'src/accounts/core/usecases/UpdateAccountBalance';
import {
  TransactionRegisteredEvent,
  TransactionRegisteredPayload,
} from 'src/transactions/core/events/TransactionRegisteredEvent';

@Injectable()
export class TransactionRegisteredHandler extends EventConsumer<TransactionRegisteredPayload> {
  constructor(
    prisma: PrismaService,
    private readonly updateAccountBalance: UpdateAccountBalance,
  ) {
    super(prisma);
  }

  get consumerName(): string {
    return 'TransactionRegisteredHandler';
  }

  restore(event: OutboxEventData): TransactionRegisteredPayload {
    return TransactionRegisteredEvent.fromOutbox(event);
  }

  async callDomain(payload: TransactionRegisteredPayload): Promise<Result<void>> {
    return this.updateAccountBalance.execute({
      accountId: payload.accountId,
      value: payload.amountInCents,
      type: payload.type,
      effectivated: payload.effectivated,
    });
  }

  @OnEvent(TransactionRegisteredEvent.EVENT_NAME)
  async handle(event: OutboxEventData): Promise<void> {
    await this.consume(event);
  }
}
