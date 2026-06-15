---
name: create-domain-event
description: >-
  Creates a Domain Event following DDD principles for this project. Use when an
  aggregate needs to notify other parts of the system that something meaningful
  happened in the domain (e.g. a transaction was registered, an entity was
  edited). Covers both the event class and its consumer (handler).
---

# Create Domain Event (finance-manager)

## What a Domain Event is

A Domain Event records that something significant happened inside the domain. It:

- Is **named in the past tense** — something *already* occurred.
- Carries the **minimum data** that subscribers need to react (IDs, amounts, statuses).
- Is **immutable** — created once inside an aggregate, never modified.
- Is **published asynchronously** via the Outbox Pattern, guaranteeing at-least-once delivery even under failures.

---

## How events flow through this project (Outbox Pattern)

```
Aggregate                   Repository (infra)              EventConsumer (infra)
──────────                  ──────────────────              ─────────────────────
register() / edit()    →    saveWithOutbox()           →    @OnEvent(EVENT_NAME)
  addDomainEvent(e)           persists aggregate              consume(event)
                              + outbox rows                     restore() → payload
                              in one transaction                callDomain(payload)
                                                                  → Handler.handle()
```

Every domain event created in `core/events/` needs a matching consumer in `infra/controllers/events/`.

---

## Two artefacts to create

| Artefact | Location | Purpose |
|---|---|---|
| **Event class** | `src/{context}/core/events/{Name}Event.ts` | Defines the event name and payload; dispatched by the aggregate |
| **Event handler** | `src/{context}/infra/controllers/events/{Group}/{Name}Handler.ts` | Subscribes to the event and calls a command/query handler |

---

## Rules for this project

### Event class
1. Extend `DomainEvent` from `@/shared/base/DomainEvent`.
2. Export a **payload interface** named `{EventName}Payload` alongside the class.
3. Declare `static readonly EVENT_NAME = '{context}.{action}'` — lowercase, dot-separated.
4. Constructor receives `private readonly data: {EventName}Payload`.
5. `get eventName()` returns `{ClassName}.EVENT_NAME`.
6. `get payload()` returns `{ ...this.data }` — spread to satisfy `Record<string, unknown>`.
7. Add `static fromOutbox(event: OutboxEventData): {EventName}Payload` — casts `event.payload` to the typed payload; used by the handler to deserialize.

### Event handler
1. Extend `EventConsumer<TPayload>` from `@/shared/events/infra/EventConsumer`.
2. Decorate with `@Injectable()`.
3. Constructor receives `PrismaService` (passed to `super`) + the command handler(s) it drives.
4. Implement `get consumerName(): string` — **unique string** used as the idempotency key; use the class name.
5. Implement `restore(event: OutboxEventData): TPayload` — delegates to `{EventClass}.fromOutbox(event)`.
6. Implement `callDomain(payload: TPayload): Promise<Result<void>>` — calls the command handler.
7. Add `@OnEvent({EventClass}.EVENT_NAME) async handle(event: OutboxEventData)` — calls `this.consume(event)`.
8. Register the handler as a provider in its NestJS module.

---

## Event class template

```typescript
// src/{context}/core/events/MyThingActionEvent.ts
import { DomainEvent } from '@/shared/base/DomainEvent';
import { OutboxEventData } from '@/shared/events/OutboxEvent';

export interface MyThingActionPayload {
  thingId: string;
  // include all fields subscribers need — prefer IDs and primitives
}

export class MyThingActionEvent extends DomainEvent {
  static readonly EVENT_NAME = '{context}.myThing.action';

  constructor(private readonly data: MyThingActionPayload) {
    super();
  }

  get eventName(): string {
    return MyThingActionEvent.EVENT_NAME;
  }

  get payload(): Record<string, unknown> {
    return { ...this.data };
  }

  static fromOutbox(event: OutboxEventData): MyThingActionPayload {
    return event.payload as unknown as MyThingActionPayload;
  }
}
```

---

## Event handler template

```typescript
// src/{context}/infra/controllers/events/{Group}/MyThingActionHandler.ts
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@/shared/infra/PrismaService';
import { OutboxEventData } from '@/shared/events/OutboxEvent';
import { EventConsumer } from '@/shared/events/infra/EventConsumer';
import { Result } from '@/shared/base';
import { MyHandler } from '@/{context}/core/commands/MyAction/MyAction.handler';
import {
  MyThingActionEvent,
  MyThingActionPayload,
} from '@/{context}/core/events/MyThingActionEvent';

@Injectable()
export class MyThingActionHandler extends EventConsumer<MyThingActionPayload> {
  constructor(
    prisma: PrismaService,
    private readonly myHandler: MyHandler,
  ) {
    super(prisma);
  }

  get consumerName(): string {
    return 'MyThingActionHandler';
  }

  restore(event: OutboxEventData): MyThingActionPayload {
    return MyThingActionEvent.fromOutbox(event);
  }

  async callDomain(payload: MyThingActionPayload): Promise<Result<void>> {
    return this.myHandler.handle({
      // map payload fields to command/query input
    });
  }

  @OnEvent(MyThingActionEvent.EVENT_NAME)
  async handle(event: OutboxEventData): Promise<void> {
    await this.consume(event);
  }
}
```

---

## How to dispatch the event from an aggregate

Inside the aggregate's `register()` (or any other mutation factory), after validation passes:

```typescript
static register(props: MyAggregateProps): Result<MyAggregate> {
  const aggregate = MyAggregate.create(props);
  if (aggregate.isFailure) return aggregate;

  aggregate.value.addDomainEvent(
    new MyThingActionEvent({
      thingId: aggregate.value.id,
      // include payload fields
    }),
  );

  return aggregate;
}
```

---

## How the repository persists the event (Outbox)

The repository implementation must call `saveWithOutbox`, passing `aggregate.domainEvents`:

```typescript
// inside the Prisma repository implementation
async save(aggregate: MyAggregate): Promise<Result<void>> {
  await saveWithOutbox(this.prisma, aggregate.domainEvents, async (tx) => {
    await tx.myThing.upsert({ /* ... */ });
  });
  return Result.ok();
}
```

`saveWithOutbox` writes both the aggregate row and all outbox rows in a single transaction, guaranteeing atomicity.

---

## Concrete examples

### Example 1: TransactionRegisteredEvent

```typescript
// src/transactions/core/events/TransactionRegisteredEvent.ts
export interface TransactionRegisteredPayload {
  transactionId: string;
  type: TransactionType;
  amountInCents: number;
  accountId: string;
  categoryId: string;
  subCategoryId: string;
  effectivated: boolean;
}

export class TransactionRegisteredEvent extends DomainEvent {
  static readonly EVENT_NAME = 'transaction.registered';

  constructor(private readonly data: TransactionRegisteredPayload) { super(); }

  get eventName() { return TransactionRegisteredEvent.EVENT_NAME; }
  get payload(): Record<string, unknown> { return { ...this.data }; }

  static fromOutbox(event: OutboxEventData): TransactionRegisteredPayload {
    return event.payload as unknown as TransactionRegisteredPayload;
  }
}
```

### Example 2: TransactionRegisteredHandler

```typescript
// src/accounts/infra/controllers/events/UpdateAccountBalance/TransactionRegisteredHandler.ts
@Injectable()
export class TransactionRegisteredHandler extends EventConsumer<TransactionRegisteredPayload> {
  constructor(prisma: PrismaService, private readonly updateAccountBalance: UpdateAccountBalance) {
    super(prisma);
  }

  get consumerName() { return 'TransactionRegisteredHandler'; }

  restore(event: OutboxEventData): TransactionRegisteredPayload {
    return TransactionRegisteredEvent.fromOutbox(event);
  }

  async callDomain(payload: TransactionRegisteredPayload): Promise<Result<void>> {
    return this.updateAccountBalance.handle({
      updatedBy: 'NEW_TRANSACTION',
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
```

---

## Handler spec template

```typescript
// src/{context}/infra/controllers/events/{Group}/MyThingActionHandler.spec.ts
import { Result } from '@/shared/base';
import { MyThingActionEvent } from '@/{context}/core/events/MyThingActionEvent';
import { MyHandler } from '@/{context}/core/commands/MyAction/MyAction.handler';
import { MyThingActionHandler } from './MyThingActionHandler';

const makePrisma = (processedCount: number) =>
  ({
    $transaction: jest.fn().mockImplementation((fn: (tx: unknown) => Promise<void>) =>
      fn({
        processedEvent: {
          createMany: jest.fn().mockResolvedValue({ count: processedCount }),
        },
      }),
    ),
  }) as any;

const makeOutboxEvent = (payload: object) => ({
  id: 'event-id',
  eventName: MyThingActionEvent.EVENT_NAME,
  payload,
});

describe('MyThingActionHandler', () => {
  const basePayload = { thingId: 'thing-1' };

  let commandHandler: jest.Mocked<MyHandler>;

  beforeEach(() => {
    commandHandler = {
      handle: jest.fn().mockResolvedValue(Result.ok(undefined)),
    } as unknown as jest.Mocked<MyHandler>;
  });

  it('should call the handler with the correct input', async () => {
    const handler = new MyThingActionHandler(makePrisma(1), commandHandler);

    await handler.handle(makeOutboxEvent(basePayload) as any);

    expect(commandHandler.handle).toHaveBeenCalledWith({ /* expected params */ });
  });

  it('should skip processing when the event was already consumed (idempotency)', async () => {
    const handler = new MyThingActionHandler(makePrisma(0), commandHandler);

    await handler.handle(makeOutboxEvent(basePayload) as any);

    expect(commandHandler.handle).not.toHaveBeenCalled();
  });

  it('should expose the correct consumerName for the idempotency key', () => {
    const handler = new MyThingActionHandler(makePrisma(1), commandHandler);

    expect(handler.consumerName).toBe('MyThingActionHandler');
  });

  it('should restore the payload from OutboxEventData', () => {
    const handler = new MyThingActionHandler(makePrisma(1), commandHandler);

    const restored = handler.restore(makeOutboxEvent(basePayload) as any);

    expect(restored).toEqual(basePayload);
  });
});
```

---

## Execution checklist

1. [ ] Name the event in the past tense: `{Context}{Thing}{Action}Event`.
2. [ ] Create `src/{context}/core/events/{Name}Event.ts` with the payload interface and class.
3. [ ] Dispatch the event inside the aggregate via `addDomainEvent(new {Name}Event({...}))`.
4. [ ] Confirm the repository implementation calls `saveWithOutbox` with `aggregate.domainEvents`.
5. [ ] Create `src/{context}/infra/controllers/events/{Group}/{Name}Handler.ts`.
6. [ ] Register the handler as a provider in the relevant NestJS module.
7. [ ] Write `{Name}Handler.spec.ts` covering: happy path, idempotency (count=0), and `restore()`.
8. [ ] Run `pnpm test -- {Name}Handler.spec.ts` and confirm all tests pass.
9. [ ] Run `pnpm lint` to ensure no linting issues.

## Quick command reference

```bash
pnpm test -- MyThingActionHandler.spec.ts
pnpm lint
```
