---
name: create-query
description: >-
  Creates a CQRS query (read operation) for finance-manager. Use when adding a
  read-only operation that returns list, detail, dashboard, report, search, or
  other DTO/read-model data.
---

# Create CQRS Query (finance-manager)

Use this skill for **read-side** application operations: list, get, search,
summarize, dashboard, report, breakdown, timeline, or any action that only reads
data and returns a read model.

For state-changing operations, use the `create-command` skill instead.

## Query convention

Queries live in the bounded context core under `queries/{Action}/` and delegate
actual data access to reader ports:

```text
src/{context}/core/
  queries/{Action}/
    {Action}.query.ts
    {Action}.result.ts
    {Action}.handler.ts
    {Action}.handler.spec.ts

  ports/readers/
    {Action}Reader.ts

src/{context}/infra/
  database/readers/
    Prisma{Action}Reader.ts
    Prisma{Action}Reader.spec.ts
  module/
```

Example:

```text
src/transactions/core/queries/ListIncome/
  ListIncome.query.ts
  ListIncome.result.ts
  ListIncome.handler.ts
  ListIncome.handler.spec.ts

src/transactions/core/ports/readers/ListIncomeReader.ts
src/transactions/infra/database/readers/PrismaListIncomeReader.ts
```

## Naming

- Input type: `{Action}Query`
- Output/read model type: `{Action}Result`
- Reader input type: `{Action}ReaderInput`
- Reader port: `{Action}Reader`
- Prisma adapter: `Prisma{Action}Reader`
- Handler class: `{Action}Handler`
- Handler method: `handle(query): Promise<Result<T>>`
- Reader method: `read(input): Promise<Result<T>>`

Use read-oriented names:

```text
ListIncomeQuery
GetDashboardSummaryQuery
GetTransactionDetailsQuery
SearchTransactionsQuery
BreakdownCategoriesQuery
```

## Rules

1. Queries **do not change state**.
2. Query handlers may validate query concepts such as date ranges, pagination,
   filters, and sorting.
3. Query handlers call a reader port; they do not use repositories for list,
   dashboard, or reporting screens.
4. Query results are read models/DTO-shaped data.
5. Do not instantiate domain aggregates just to return data to the UI.
6. Reader ports live in `core/ports/readers/` as `abstract class` DI tokens.
7. Reader implementations live in `infra/database/readers/`.
8. Reader implementations may use Prisma `findMany`, `aggregate`, `groupBy`, or
   `$queryRaw` for optimized reads.
9. Put query-specific result types beside the handler, not inside controller
   DTOs.
10. Write a unit spec next to every query handler and separate specs for Prisma
    readers.

## Query template

`{Action}.query.ts`:

```typescript
export type ListThingsQuery = {
  startDate?: Date;
  endDate?: Date;
};
```

`{Action}.result.ts`:

```typescript
export type ListThingsResult = {
  id: string;
  name: string;
  total: number;
  occurredAt: Date;
};
```

`core/ports/readers/{Action}Reader.ts`:

```typescript
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

`{Action}.handler.ts`:

```typescript
import { Result } from '@/shared/base';
import { ReportingPeriod } from '@/shared/ValueObjects';
import { endOfMonth, startOfMonth } from 'date-fns';
import { ListThingsReader } from '@/{context}/core/ports/readers/ListThingsReader';
import { ListThingsQuery } from './ListThings.query';
import { ListThingsResult } from './ListThings.result';

export class ListThingsHandler {
  constructor(private readonly reader: ListThingsReader) {}

  async handle(query: ListThingsQuery = {}): Promise<Result<ListThingsResult[]>> {
    const today = new Date();

    const period = ReportingPeriod.create({
      startDate: query.startDate ?? startOfMonth(today),
      endDate: query.endDate ?? endOfMonth(today),
    });

    if (period.isFailure) return period.asFail();

    return this.reader.read({
      startDate: period.value.startDate,
      endDate: period.value.endDate,
    });
  }
}
```

## Prisma reader template

```typescript
import { Result } from '@/shared/base';
import {
  ListThingsReader,
  ListThingsReaderInput,
} from '@/{context}/core/ports/readers/ListThingsReader';
import { ListThingsResult } from '@/{context}/core/queries/ListThings/ListThings.result';
import { PrismaService } from '@/shared/infra/db/PrismaService';

export class PrismaListThingsReader implements ListThingsReader {
  constructor(private readonly prisma: PrismaService) {}

  async read(input: ListThingsReaderInput): Promise<Result<ListThingsResult[]>> {
    try {
      const rows = await this.prisma.thing.findMany({
        where: {
          occurredAt: {
            gte: input.startDate,
            lte: input.endDate,
          },
        },
        orderBy: { occurredAt: 'desc' },
      });

      return Result.ok(
        rows.map((row) => ({
          id: row.id,
          name: row.name,
          total: row.total,
          occurredAt: row.occurredAt,
        })),
      );
    } catch (error) {
      return Result.fail({
        code: Errors.PRISMA_QUERY_ERROR,
        cls: this.constructor.name,
        data: { error: String(error) },
      });
    }
  }
}
```

## NestJS module registration

Register the reader port and query handler in
`src/{context}/infra/module/{context}.module.ts`:

```typescript
{
  provide: ListThingsReader,
  useFactory: (prisma: PrismaService) => new PrismaListThingsReader(prisma),
  inject: [PrismaService],
},
{
  provide: ListThingsHandler,
  useFactory: (reader: ListThingsReader) => new ListThingsHandler(reader),
  inject: [ListThingsReader],
},
```

## Testing

Query handler tests should:

- Mock the reader port.
- Assert default filters/date ranges are applied.
- Assert validation failures are propagated before calling the reader.
- Assert reader failures are propagated.
- Assert returned read models are passed through unchanged.

Prisma reader tests should:

- Mock Prisma calls.
- Assert the generated Prisma query shape.
- Assert row-to-result mapping.
- Assert Prisma errors become `Result.fail(...)`.

## Migration note

Older read operations named `*.usecase.ts` or `*.query.ts` ports should be
migrated to the query handler + reader layout when touched. Do not add new read
operations under `core/usecases/` or reporting/list methods to repositories.
