---
name: create-controller
description: >-
  Creates an HTTP controller in the infrastructure layer for this project. Use
  when the user asks to expose a CQRS command or query handler via REST endpoint. Covers the
  controller class, request/response DTOs, and module registration.
---

# Create Controller (finance-manager)

## What a controller is

A controller is the HTTP entry point for one or more CQRS handlers. It:

- Receives an HTTP request and maps it to a **command** or **query** object (flat primitives).
- Delegates execution to the appropriate **handler**.
- Maps a domain result to a **response DTO** or throws an HTTP exception.
- Contains **no business logic** — any conditional logic here is HTTP-mapping only.

---

## Three artefacts to create

| Artefact | Location | Purpose |
|---|---|---|
| **Controller** | `src/{context}/infra/controllers/{Context}.controller.ts` | Handles HTTP routes; calls command/query handlers |
| **Request DTO** | `src/{context}/infra/dtos/{Action}.dto.ts` | Validates and documents the incoming body/query |
| **Response DTO** | `src/{context}/infra/dtos/{Action}Response.dto.ts` | Shapes and documents the outgoing JSON; has `static fromDomain()` |

After creating these, **register the controller in the module** (`src/{context}/infra/module/{context}.module.ts`).

---

## Rules for this project

### Controller
1. Decorate with `@Controller('{route}')`.
2. Declare `private readonly logger = new Logger(ClassName.name)`.
3. Inject CQRS handlers via constructor from `core/commands/{Action}/{Action}.handler` or `core/queries/{Action}/{Action}.handler`. Handler ports live under `core/ports/`.
4. Every method: HTTP verb decorator + `@HttpCode(HttpStatus.XYZ)` + Swagger decorators.
5. After calling the handler, always check `result.isFailure` → log with `this.logger.error(...)` → call `MapResultErrorToHttpException.throwException(result)`.
6. Methods that return a body must call `ResponseDto.fromDomain(result.value)`.
7. Methods that return `void` (`204 No Content`) omit the `fromDomain` call.
8. For `GET` with query params, add `@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))` on the method.

### Request DTO
1. Plain class — no base class, no `@Injectable()`.
2. Every field gets `class-validator` decorators (`@IsString`, `@IsNumber`, `@IsUUID`, `@IsBoolean`, `@IsDateString`, etc.).
3. Every field gets `@ApiProperty()` or `@ApiPropertyOptional()` with an example value.
4. Optional fields use `@IsOptional()` first, then the type decorator.
5. Dates arrive as ISO strings (`@IsDateString()`); convert to `Date` in the controller (`new Date(dto.field)`).
6. Query params that need type coercion (e.g. boolean from `"true"`) use `@Transform` from `class-transformer`.

### Response DTO
1. Plain class with `@ApiProperty()` on every field.
2. Fields are **primitives** (`string`, `number`, `boolean`) — never domain objects.
3. Must have `static fromDomain(domain: DomainType): ResponseDto` that maps domain fields to primitives (e.g. `Money.amount` instead of `Money`).
4. Nested response shapes use separate inner DTO classes.

---

## HTTP status codes and Swagger decorators

| HTTP verb | Status | Swagger on method |
|---|---|---|
| `@Post` | `201 CREATED` | `@ApiBody({ type: RequestDto })` + `@ApiCreatedResponse({ type: ResponseDto })` |
| `@Put` / `@Patch` | `204 NO_CONTENT` | `@ApiParam(...)` + `@ApiBody({ type: RequestDto })` + `@ApiNoContentResponse()` |
| `@Get` | `200 OK` | `@ApiOkResponse({ type: ResponseDto })` |

---

## Controller template

```typescript
// src/{context}/infra/controllers/{Context}.controller.ts
import { Body, Controller, HttpCode, HttpStatus, Logger, Param, Post, Put, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiParam } from '@nestjs/swagger';
import { MapResultErrorToHttpException } from '@/shared/infra/MapResultErrorToHttpException';
import { RegisterThingHandler } from '@/{context}/core/commands/RegisterThing/RegisterThing.handler';
import { ListThingsHandler } from '@/{context}/core/queries/ListThings/ListThings.handler';
import { MyActionDto } from '@/{context}/infra/dtos/MyAction.dto';
import { MyActionResponseDto } from '@/{context}/infra/dtos/MyActionResponse.dto';

@Controller('{route}')
export class MyContextController {
  private readonly logger = new Logger(MyContextController.name);

  constructor(
    private readonly registerThingCommandHandler: RegisterThingHandler,
    private readonly listThingsQueryHandler: ListThingsHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: MyActionDto })
  @ApiCreatedResponse({ type: MyActionResponseDto })
  async myAction(@Body() dto: MyActionDto): Promise<MyActionResponseDto> {
    const result = await this.registerThingCommandHandler.handle({
      // map dto fields to command fields (convert types as needed)
      name: dto.name,
      amount: dto.amount,
    });

    if (result.isFailure) {
      this.logger.error(`Error during my action: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }

    return MyActionResponseDto.fromDomain(result.value);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: MyActionDto })
  @ApiNoContentResponse()
  async updateMyAction(@Param('id') id: string, @Body() dto: MyActionDto): Promise<void> {
    const result = await this.registerThingCommandHandler.handle({ id, name: dto.name });

    if (result.isFailure) {
      this.logger.error(`Error during update my action: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOkResponse({ type: MyActionResponseDto })
  async listMyAction(@Query() query: MyActionQueryDto): Promise<MyActionResponseDto> {
    const result = await this.listThingsQueryHandler.handle({
      startDate: new Date(query.startDate),
    });

    if (result.isFailure) {
      this.logger.error(`Error during list my action: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }

    return MyActionResponseDto.fromDomain(result.value);
  }
}
```

---

## Request DTO templates

### Body DTO (POST / PUT)

```typescript
// src/{context}/infra/dtos/MyAction.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class MyActionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @ApiProperty({ example: 'My value' })
  name!: string;

  @IsNumber()
  @ApiProperty({ example: 100 })
  amount!: number;

  @IsUUID()
  @ApiProperty({ format: 'uuid' })
  relatedId!: string;

  @IsDateString()
  @ApiProperty({ type: String, format: 'date-time', example: '2026-01-15T12:00:00.000Z' })
  dueDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @ApiPropertyOptional({ maxLength: 2000 })
  notes?: string;
}
```

### Query DTO (GET)

```typescript
// src/{context}/infra/dtos/MyActionQuery.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class MyActionQueryDto {
  @IsDateString()
  @ApiProperty({ type: String, format: 'date-time', example: '2026-01-01T00:00:00.000Z' })
  startDate!: string;

  @IsDateString()
  @ApiProperty({ type: String, format: 'date-time', example: '2026-01-31T23:59:59.999Z' })
  endDate!: string;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @ApiProperty({ example: false })
  effectivated!: boolean;

  @IsOptional()
  @ApiPropertyOptional()
  optionalField?: string;
}
```

---

## Response DTO template

```typescript
// src/{context}/infra/dtos/MyActionResponse.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { MyAggregate } from '@/{context}/core/model/MyAggregate';

export class MyActionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'My value' })
  name!: string;

  @ApiProperty({ example: 100.5, description: 'Amount as a decimal value' })
  amount!: number;

  static fromDomain(aggregate: MyAggregate): MyActionResponseDto {
    const dto = new MyActionResponseDto();
    dto.id = aggregate.id;
    dto.name = aggregate.name;
    dto.amount = aggregate.amount.amount; // unwrap Value Object to primitive
    return dto;
  }
}
```

---

## Module registration

Add the controller to `controllers` and each command/query handler to `providers` using the factory pattern:

```typescript
// src/{context}/infra/module/{context}.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from '@/shared/infra/PrismaService';
import { MyContextController } from '@/{context}/infra/controllers/MyContext.controller';
import { MyRepository } from '@/{context}/core/ports/repositories/My.repository';
import { PrismaMyRepository } from '@/{context}/infra/database/repositories/PrismaMyRepository';
import { RegisterThingHandler } from '@/{context}/core/commands/RegisterThing/RegisterThing.handler';
import { ListThingsHandler } from '@/{context}/core/queries/ListThings/ListThings.handler';

@Module({
  controllers: [MyContextController],
  providers: [
    PrismaService,
    {
      provide: MyRepository,
      useFactory: (prisma: PrismaService) => new PrismaMyRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: RegisterThingHandler,
      useFactory: (repo: MyRepository) => new RegisterThingHandler(repo),
      inject: [MyRepository],
    },
  ],
})
export class MyContextModule {}
```

> **Adding to an existing module**: insert the controller in `controllers: [...]` and append the new command/query handler provider object to `providers: [...]`.

---

## Error mapping

When a new error code needs a specific HTTP status, add it to `src/shared/infra/MapResultErrorToHttpException.ts`:

```typescript
case 'MY_NEW_ERROR_CODE':
  throw new BadRequestException();   // or NotFoundException, InternalServerErrorException
```

---

## Concrete examples

### Example 1: AccountsController (POST → 201, body DTO, response DTO)

```typescript
@Controller('accounts')
export class AccountsController {
  private readonly logger = new Logger(AccountsController.name);

  constructor(private readonly registerThingCommandHandler: RegisterThingHandler) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'Account created.', type: CreateAccountResponseDto })
  async create(@Body() dto: CreateAccountDto): Promise<CreateAccountResponseDto> {
    const result = await this.registerThingCommandHandler.handle({
      name: dto.name,
      openingBalance: dto.openingBalance,
      balance: 0,
    });
    if (result.isFailure) {
      this.logger.error(`Error during create account: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }
    return CreateAccountResponseDto.fromDomain(result.value);
  }
}
```

---

### Example 2: ReportingController (GET → 200, query DTO, `@UsePipes`)

```typescript
@Controller('reporting')
export class ReportingController {
  private readonly logger = new Logger(ReportingController.name);

  constructor(private readonly listThingsQueryHandler: ListThingsHandler) {}

  @Get('categories/breakdown')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOkResponse({ type: BreakdownCategoriesResponseDto })
  async breakdownCategories(
    @Query() query: BreakdownCategoriesQueryDto,
  ): Promise<BreakdownCategoriesResponseDto> {
    const result = await this.listThingsQueryHandler.handle({
      startDate: new Date(query.startDate),
      endDate: new Date(query.endDate),
      effectivated: query.effectivated,
      categoriesId: query.categoriesId,
    });
    if (result.isFailure) {
      this.logger.error(`Error during breakdown categories: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }
    return BreakdownCategoriesResponseDto.fromDomain(result.value);
  }
}
```

---

## Execution checklist

1. [ ] Create the request DTO at `src/{context}/infra/dtos/{Action}.dto.ts`.
2. [ ] Create the response DTO at `src/{context}/infra/dtos/{Action}Response.dto.ts` with `static fromDomain()`.
3. [ ] Create or update the controller at `src/{context}/infra/controllers/{Context}.controller.ts`.
4. [ ] Register the controller and its command/query handler providers in `src/{context}/infra/module/{context}.module.ts`.
5. [ ] If the command/query handler produces a new error code, add it to `MapResultErrorToHttpException`.
6. [ ] Run `pnpm lint` to ensure no linting issues.

## Quick command reference

```bash
pnpm lint
```
