---
name: create-use-case
description: >-
  Creates a CQRS application operation for finance-manager. Use when adding a
  command (write) or query (read) handler in a bounded context.
---

# Create CQRS Handler (finance-manager)

## Core convention

The project uses CQRS inside each bounded context.

- **Commands** change state and may use domain aggregates, value objects, domain services, repositories, events, transactions, and outbox.
- **Queries** only read data and return read models/DTO-shaped results. They must not rebuild domain aggregates just to display data.

Default layout:

```text
src/{context}/core/
  commands/{Action}/
    {Action}.command.ts
    {Action}.handler.ts
    {Action}.handler.spec.ts

  queries/{Action}/
    {Action}.query.ts
    {Action}.result.ts
    {Action}.handler.ts
    {Action}.handler.spec.ts

  model/
  service/
  events/
  ports/
    repositories/
    readers/
    acl/

src/{context}/infra/
  database/
    repositories/
    readers/
  controllers/
  dtos/
  module/
```

## Ports

Ports are `abstract class` declarations, not TypeScript interfaces, so NestJS can use them as DI tokens.

| Kind | Location | Naming | Purpose |
|---|---|---|---|
| Repository | `core/ports/repositories/` | `{Context}Repository` | Persist/load aggregates owned by the context |
| Reader | `core/ports/readers/` | `{Action}Reader` | Return read models for query handlers |
| ACL Reader | `core/ports/acl/` | `{ExternalConcept}Reader` | Check/read lightweight data from another context |

Rules:

- Repositories return domain entities/aggregates.
- Readers return read models/results, never domain aggregates.
- Do not add screen/reporting methods to repositories; create a dedicated reader/query instead.
- Infrastructure implementations go under `infra/database/repositories/` or `infra/database/readers/`.

## Command rules

1. Put commands under `src/{context}/core/commands/{Action}/`.
2. Name input type `{Action}Command` in `{Action}.command.ts`.
3. Name handler `{Action}Handler` in `{Action}.handler.ts`.
4. Handler method is `handle(command): Promise<Result<T>>`.
5. Constructor receives only ports: repositories, readers/ACLs, or publishers.
6. Delegate domain rules to entities, value objects, and domain services.
7. Use `Result.combine([...])` for multiple validations.
8. Use `.asFail()` to propagate failures.
9. Use `Promise.all([...])` for independent async checks.
10. Write `{Action}.handler.spec.ts` next to the handler.

Command template:

```typescript
// src/{context}/core/commands/RegisterThing/RegisterThing.command.ts
export type RegisterThingCommand = {
  name: string;
  relatedId: string;
};
```

```typescript
// src/{context}/core/commands/RegisterThing/RegisterThing.handler.ts
import { Result } from '@/shared/base';
import { ThingsRepository } from '@/{context}/core/ports/repositories/Things.repository';
import { RelatedThingReader } from '@/{context}/core/ports/acl/RelatedThing.reader';
import { Thing } from '@/{context}/core/model/Thing';
import { RegisterThingCommand } from './RegisterThing.command';

export class RegisterThingHandler {
  constructor(
    private readonly thingsRepository: ThingsRepository,
    private readonly relatedThings: RelatedThingReader,
  ) {}

  async handle(command: RegisterThingCommand): Promise<Result<Thing>> {
    const thing = Thing.register(command);
    const related = await this.relatedThings.existsById(command.relatedId);

    const combined = Result.combine([thing, related]);
    if (combined.isFailure) return combined.asFail();

    const persisted = await this.thingsRepository.save(thing.value);
    if (persisted.isFailure) return persisted.asFail();

    return Result.ok(thing.value);
  }
}
```

## Query rules

1. Put query handlers under `src/{context}/core/queries/{Action}/`.
2. Name input type `{Action}Query` in `{Action}.query.ts`.
3. Name output/read model `{Action}Result` in `{Action}.result.ts`.
4. Name handler `{Action}Handler` in `{Action}.handler.ts`.
5. Handler method is `handle(query): Promise<Result<ResultType>>`.
6. Query handlers may validate query concepts such as periods/date ranges.
7. Query handlers call a reader port; they do not use repositories for reporting/list screens.
8. Reader implementations may use Prisma `findMany`, `aggregate`, `groupBy`, or `$queryRaw` for optimized reads.
9. Return read models/DTO-shaped data; do not instantiate domain aggregates on the read side.
10. Write `{Action}.handler.spec.ts` next to the handler.

Query template:

```typescript
// src/{context}/core/queries/ListThings/ListThings.query.ts
export type ListThingsQuery = {
  startDate?: Date;
  endDate?: Date;
};
```

```typescript
// src/{context}/core/queries/ListThings/ListThings.result.ts
export type ListThingsResult = {
  id: string;
  name: string;
  total: number;
};
```

```typescript
// src/{context}/core/ports/readers/ListThings.reader.ts
import { Result } from '@/shared/base';
import { ListThingsResult } from '@/{context}/core/queries/ListThings/ListThings.result';

export type ListThingsReaderInput = {
  startDate: Date;
  endDate: Date;
};

export abstract class ListThingsReader {
  abstract read(input: ListThingsReaderInput): Promise<Result<ListThingsResult[]>>;
}
```

```typescript
// src/{context}/core/queries/ListThings/ListThings.handler.ts
import { Result } from '@/shared/base';
import { ListThingsReader } from '@/{context}/core/ports/readers/ListThings.reader';
import { ListThingsQuery } from './ListThings.query';
import { ListThingsResult } from './ListThings.result';

export class ListThingsHandler {
  constructor(private readonly reader: ListThingsReader) {}

  async handle(query: ListThingsQuery = {}): Promise<Result<ListThingsResult[]>> {
    return this.reader.read({
      startDate: query.startDate ?? new Date(),
      endDate: query.endDate ?? new Date(),
    });
  }
}
```

## NestJS module registration

Register handlers and ports in `src/{context}/infra/module/{context}.module.ts`:

```typescript
{
  provide: ThingsRepository,
  useFactory: (prisma: PrismaService) => new PrismaThingsRepository(prisma),
  inject: [PrismaService],
},
{
  provide: ListThingsReader,
  useFactory: (prisma: PrismaService) => new PrismaListThingsReader(prisma),
  inject: [PrismaService],
},
{
  provide: RegisterThingHandler,
  useFactory: (repo: ThingsRepository, related: RelatedThingReader) =>
    new RegisterThingHandler(repo, related),
  inject: [ThingsRepository, RelatedThingReader],
},
{
  provide: ListThingsHandler,
  useFactory: (reader: ListThingsReader) => new ListThingsHandler(reader),
  inject: [ListThingsReader],
},
```

## Testing

- Commands: mock repositories and readers; assert domain creation/mutation and persistence calls.
- Queries: mock reader ports; assert query validation/defaults and returned read model.
- Infrastructure readers/repositories: test Prisma calls/mapping/error handling separately.

## Migration note

Older files named `*.usecase.ts` should be migrated to the command/query handler layout when touched. Do not add new use cases under `core/usecases/`.
