import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@/shared/infra/PrismaService';
import { OutboxEventData } from '@/shared/events/OutboxEvent';
import { EventConsumer } from '@/shared/events/infra/EventConsumer';
import { Result } from '@/shared/base';
import { UpdateAccountBalance } from '@/accounts/core/usecases/UpdateAccountBalance';
import {
  TransactionEditedEvent,
  TransactionEditedPayload,
} from '@/transactions/core/events/TransactionEditedEvent';

@Injectable()
export class TransactionEditedHandler extends EventConsumer<TransactionEditedPayload> {
  constructor(
    prisma: PrismaService,
    private readonly updateAccountBalance: UpdateAccountBalance,
  ) {
    super(prisma);
  }

  get consumerName(): string {
    return 'TransactionEditedHandler';
  }

  restore(event: OutboxEventData): TransactionEditedPayload {
    return TransactionEditedEvent.fromOutbox(event);
  }

  async callDomain(payload: TransactionEditedPayload): Promise<Result<void>> {
    return this.updateAccountBalance.execute({
      updatedBy: 'EDIT',
      accountId: payload.newValues.accountId,
      oldValue: payload.oldValues.amount,
      newValue: payload.newValues.amount,
      type: payload.newValues.type as 'EXPENSE' | 'INCOME',
      newEffectivated: payload.newValues.effectivated,
      oldEffectivated: payload.oldValues.effectivated,
    });
  }

  @OnEvent(TransactionEditedEvent.EVENT_NAME)
  async handle(event: OutboxEventData): Promise<void> {
    await this.consume(event);
  }
}
