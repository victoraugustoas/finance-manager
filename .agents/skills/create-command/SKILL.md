---
name: create-command
description: >-
  Creates a CQRS command (write operation) for finance-manager. Use when adding
  an operation that changes state, applies business rules, persists aggregates,
  or emits domain events.
---

# Create CQRS Command (finance-manager)

Use this skill for **write-side** application operations: create, register, edit,
delete, effectivate, transfer, reconcile, import, or any action that changes
state.

For read-only endpoints, use the `create-query` skill instead.

## Command convention

Commands live in the bounded context core under `commands/{Action}/`:

```text
src/{context}/core/
  commands/{Action}/
    {Action}.command.ts
    {Action}.handler.ts
    {Action}.handler.spec.ts

  ports/
    repositories/
    readers/
    acl/

src/{context}/infra/
  database/repositories/
  module/
```

Example:

```text
src/transactions/core/commands/RegisterIncome/
  RegisterIncome.command.ts
  RegisterIncome.handler.ts
  RegisterIncome.handler.spec.ts
```

## Naming

- Input type: `{Action}Command`
- Handler class: `{Action}Handler`
- Handler contract: `implements CommandHandler<{Action}Command, T>`
- Handler method: `handle(command): Promise<Result<T>>`
- File names:
  - `{Action}.command.ts`
  - `{Action}.handler.ts`
  - `{Action}.handler.spec.ts`

Use imperative/action names:

```text
RegisterIncomeCommand
EditTransactionCommand
CreateAccountCommand
DeleteCategoryCommand
EffectivateTransactionCommand
```

## Rules

1. Commands **change state**.
2. Commands may use domain entities, aggregates, value objects, domain services,
   domain events, repositories, transactions, and outbox.
3. Command handlers implement `CommandHandler<Command, Return>` from `@/shared/base`.
4. Commands should not return screen/reporting projections. If the UI needs a
   view model, create a query.
5. Handler constructors receive ports only: repositories, ACL readers, event
   publishers, or other infrastructure boundaries.
6. Repositories live in `core/ports/repositories/` as `abstract class` DI tokens.
7. Repository implementations live in `infra/database/repositories/`.
8. Commands with `effectivated` / `effectivatedDate` fields should declare an
   `interface` that extends `EffectivatedProps` from
   `@/shared/ValueObjects/Effectivated`.
9. Cross-context lookups/checks use lightweight ACL reader ports in
   `core/ports/acl/`.
10. Delegate business rules to domain objects/services; keep the handler as an
   application orchestration layer.
11. Use `Result.combine([...])` for multiple validations.
12. Use `.asFail()` to propagate failures.
13. Use `Promise.all([...])` for independent async checks.
14. Write a unit spec next to every command handler.

## Command template

`{Action}.command.ts`:

```typescript
import { EffectivatedProps } from '@/shared/ValueObjects/Effectivated';

export interface RegisterThingCommand extends EffectivatedProps {
  name: string;
  amount: number;
  relatedId: string;
}
```

`{Action}.handler.ts`:

```typescript
import { CommandHandler, Result } from '@/shared/base';
import { ThingsRepository } from '@/{context}/core/ports/repositories/Things.repository';
import { RelatedThingReader } from '@/{context}/core/ports/acl/RelatedThing.reader';
import { Thing } from '@/{context}/core/model/Thing';
import { RegisterThingCommand } from './RegisterThing.command';

export class RegisterThingHandler implements CommandHandler<RegisterThingCommand, Thing> {
  constructor(
    private readonly thingsRepository: ThingsRepository,
    private readonly relatedThings: RelatedThingReader,
  ) {}

  async handle(command: RegisterThingCommand): Promise<Result<Thing>> {
    const thing = Thing.register({
      name: command.name,
      amount: command.amount,
      relatedId: command.relatedId,
      effectivated: command.effectivated,
      effectivatedDate: command.effectivatedDate,
    });

    const related = await this.relatedThings.existsById(command.relatedId);

    const combined = Result.combine([thing, related]);
    if (combined.isFailure) return combined.asFail();

    const persisted = await this.thingsRepository.save(thing.value);
    if (persisted.isFailure) return persisted.asFail();

    return Result.ok(thing.value);
  }
}
```

## Repository port template

```typescript
import { Result } from '@/shared/base';
import { Thing } from '@/{context}/core/model/Thing';

export abstract class ThingsRepository {
  abstract save(thing: Thing): Promise<Result<void>>;
  abstract findById(id: string): Promise<Result<Thing>>;
}
```

Repository rules:

- Use repositories for aggregate persistence/loading on the write side.
- Do not add report/list/dashboard methods to repositories.
- If a method returns DTO-shaped data, it probably belongs in a query reader.

## ACL reader template for command checks

Use ACL readers only for lightweight cross-context checks/read-only references
needed by commands.

```typescript
import { Result } from '@/shared/base';

export abstract class RelatedThingReader {
  abstract existsById(id: string): Promise<Result<void>>;
}
```

## NestJS module registration

Register the repository/ACL ports and the command handler in
`src/{context}/infra/module/{context}.module.ts`:

```typescript
{
  provide: ThingsRepository,
  useFactory: (prisma: PrismaService) => new PrismaThingsRepository(prisma),
  inject: [PrismaService],
},
{
  provide: RelatedThingReader,
  useFactory: (prisma: PrismaService) => new PrismaRelatedThingReader(prisma),
  inject: [PrismaService],
},
{
  provide: RegisterThingHandler,
  useFactory: (repo: ThingsRepository, related: RelatedThingReader) =>
    new RegisterThingHandler(repo, related),
  inject: [ThingsRepository, RelatedThingReader],
},
```

## Testing

Command handler tests should:

- Mock repositories and ACL readers.
- Assert the handler calls `handle(command)` through public API.
- Assert validations and domain failures are propagated.
- Assert persistence is called only after validations pass.
- Assert repository errors are propagated.
- Avoid Prisma in command handler tests; Prisma belongs in repository adapter tests.

## Migration note

Older write operations named `*.usecase.ts` should be migrated to the command
layout when touched. Do not add new write operations under `core/usecases/`.
