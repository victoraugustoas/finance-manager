import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { CategoryType } from '@/shared/enums/category-type';
import { Money } from '@/shared/ValueObjects/money.vo';
import {
  AccountWithBalanceOutDTO,
  BreakdownCategoriesComposerService,
  BreakdownCategoriesOutDTO,
  MovementPartyOutDTO,
  StatementDayOutDTO,
  StatementEntryOutDTO,
  StatementOutDTO,
} from '@/modules/reporting';

const toDecimal = (amountInCents: number): number => Money.fromCents(amountInCents).amount;

export class ListAccountsQueryHttpDto {
  @IsDateString()
  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-01-31T23:59:59.999Z',
    description: 'Balance calculation end date.',
  })
  endDate!: string;
}

export class BreakdownCategoriesQueryHttpDto {
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

  /** Comma-separated UUIDs, e.g. `id1,id2` */
  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || value === '') return undefined;
    const raw = Array.isArray(value) ? value : String(value).split(',');
    return raw.map((item: string) => item.trim()).filter(Boolean);
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'Optional filter: comma-separated category IDs (`id1,id2`)',
    example: ['a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002'],
  })
  categoriesId?: string[];

  @IsEnum(CategoryType)
  @ApiProperty({ enum: CategoryType, example: CategoryType.EXPENSE })
  type!: CategoryType;
}

export class StatementQueryHttpDto {
  @IsDateString()
  @ApiProperty({ type: String, format: 'date-time', example: '2026-01-01T00:00:00.000Z' })
  startDate!: string;

  @IsDateString()
  @ApiProperty({ type: String, format: 'date-time', example: '2026-01-31T23:59:59.999Z' })
  endDate!: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ format: 'uuid' })
  accountId?: string;
}

export class ListAccountsItemResponseHttpDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Nubank' })
  name!: string;

  @ApiProperty({ example: 100.5, description: 'Opening balance as a decimal amount' })
  openingBalance!: number;

  @ApiProperty({ example: 201, description: 'Calculated account balance as a decimal amount' })
  balance!: number;

  @ApiProperty({
    example: 245.75,
    description:
      'Estimated account balance as a decimal amount, including pending and effectivated transactions up to the end date',
  })
  estimatedBalance!: number;
}

export class ListAccountsResponseHttpDto {
  @ApiProperty({ type: [ListAccountsItemResponseHttpDto] })
  accounts!: ListAccountsItemResponseHttpDto[];

  static fromQuery(accounts: AccountWithBalanceOutDTO[]): ListAccountsResponseHttpDto {
    const dto = new ListAccountsResponseHttpDto();
    dto.accounts = accounts.map(({ account, balanceInCents, estimatedBalanceInCents }) => {
      const item = new ListAccountsItemResponseHttpDto();
      item.id = account.id;
      item.name = account.name;
      item.openingBalance = toDecimal(account.openingBalanceInCents);
      item.balance = toDecimal(balanceInCents);
      item.estimatedBalance = toDecimal(estimatedBalanceInCents);
      return item;
    });
    return dto;
  }
}

/** Row in the breakdown: monetary total as a decimal (same convention as command DTOs). */
export class BreakdownCategoriesCategoryRowHttpDto {
  @ApiProperty({ example: 'Food' })
  name!: string;

  @ApiProperty({ example: 125.5, description: 'Total as a decimal amount' })
  total!: number;
}

export class BreakdownCategoriesResponseHttpDto {
  @ApiProperty({
    type: [BreakdownCategoriesCategoryRowHttpDto],
    description:
      'At most six rows. When there are more than six categories upstream, totals beyond the top five are aggregated into one row (`Others`). Example below: six rows — five named categories plus `Others` grouping the remainder — sorted by descending total.',
    example: [
      { name: 'Housing', total: 3200 },
      { name: 'Food', total: 890.5 },
      { name: BreakdownCategoriesComposerService.othersCategoryLabel, total: 412.75 },
      { name: 'Transport', total: 340 },
      { name: 'Health', total: 210 },
      { name: 'Leisure', total: 180 },
    ],
  })
  categories!: BreakdownCategoriesCategoryRowHttpDto[];

  static fromQuery(breakdown: BreakdownCategoriesOutDTO): BreakdownCategoriesResponseHttpDto {
    const dto = new BreakdownCategoriesResponseHttpDto();
    dto.categories = breakdown.categories.map((row) => {
      const item = new BreakdownCategoriesCategoryRowHttpDto();
      item.name = row.name;
      item.total = toDecimal(row.totalInCents);
      return item;
    });
    return dto;
  }
}

class StatementPartyResponseHttpDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Nubank' })
  name!: string;
}

class StatementBalanceImpactResponseHttpDto {
  @ApiProperty({ enum: ['IN', 'OUT', 'NEUTRAL'] })
  direction!: 'IN' | 'OUT' | 'NEUTRAL';

  @ApiProperty({ example: 45.9 })
  amount!: number;
}

class StatementEntryResponseHttpDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ['INCOME', 'EXPENSE', 'TRANSFER'] })
  movementType!: StatementEntryOutDTO['movementType'];

  @ApiProperty({ example: 'Groceries' })
  name!: string;

  @ApiProperty({ example: 45.9 })
  amount!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  dueDate!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  entryDate!: string;

  @ApiProperty({ example: true })
  effectivated!: boolean;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  effectivatedDate?: string | null;

  @ApiPropertyOptional({ example: 'Optional notes', nullable: true })
  notes?: string | null;

  @ApiPropertyOptional({ type: StatementPartyResponseHttpDto })
  account?: MovementPartyOutDTO;

  @ApiPropertyOptional({ type: StatementPartyResponseHttpDto })
  originAccount?: MovementPartyOutDTO;

  @ApiPropertyOptional({ type: StatementPartyResponseHttpDto })
  destinationAccount?: MovementPartyOutDTO;

  @ApiPropertyOptional({ type: StatementPartyResponseHttpDto })
  category?: MovementPartyOutDTO;

  @ApiPropertyOptional({ type: StatementPartyResponseHttpDto })
  subCategory?: MovementPartyOutDTO;

  @ApiProperty({ type: StatementBalanceImpactResponseHttpDto })
  balanceImpact!: StatementBalanceImpactResponseHttpDto;

  @ApiProperty({
    example: true,
    description: 'Whether this entry was included in the calculated balance for its statement day.',
  })
  includedInBalance!: boolean;

  static fromQuery(entry: StatementEntryOutDTO): StatementEntryResponseHttpDto {
    const dto = new StatementEntryResponseHttpDto();
    dto.id = entry.id;
    dto.movementType = entry.movementType;
    dto.name = entry.name;
    dto.amount = toDecimal(entry.amountInCents);
    dto.dueDate = entry.dueDate.toISOString();
    dto.entryDate = entry.entryDate.toISOString();
    dto.effectivated = entry.effectivated;
    dto.effectivatedDate = entry.effectivatedDate?.toISOString() ?? null;
    dto.notes = entry.notes ?? null;
    dto.account = entry.account;
    dto.originAccount = entry.originAccount;
    dto.destinationAccount = entry.destinationAccount;
    dto.category = entry.category;
    dto.subCategory = entry.subCategory;
    dto.balanceImpact = {
      direction: entry.balanceImpact.direction,
      amount: toDecimal(entry.balanceImpact.amountInCents),
    };
    dto.includedInBalance = entry.includedInBalance;
    return dto;
  }
}

class StatementDayResponseHttpDto {
  @ApiProperty({ type: String, format: 'date-time' })
  date!: string;

  @ApiProperty({ example: 1550.25 })
  balance!: number;

  @ApiProperty({ type: [StatementEntryResponseHttpDto] })
  entries!: StatementEntryResponseHttpDto[];

  static fromQuery(day: StatementDayOutDTO): StatementDayResponseHttpDto {
    const dto = new StatementDayResponseHttpDto();
    dto.date = day.date.toISOString();
    dto.balance = toDecimal(day.balanceInCents);
    dto.entries = day.entries.map(StatementEntryResponseHttpDto.fromQuery);
    return dto;
  }
}

export class StatementResponseHttpDto {
  @ApiProperty({ type: String, format: 'date-time' })
  startDate!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  endDate!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  accountId?: string;

  @ApiProperty({ example: 1000 })
  initialBalance!: number;

  @ApiProperty({ example: 1250.5 })
  finalBalance!: number;

  @ApiProperty({ type: [StatementDayResponseHttpDto] })
  days!: StatementDayResponseHttpDto[];

  static fromQuery(statement: StatementOutDTO): StatementResponseHttpDto {
    const dto = new StatementResponseHttpDto();
    dto.startDate = statement.startDate.toISOString();
    dto.endDate = statement.endDate.toISOString();
    dto.accountId = statement.accountId;
    dto.initialBalance = toDecimal(statement.initialBalanceInCents);
    dto.finalBalance = toDecimal(statement.finalBalanceInCents);
    dto.days = statement.days.map(StatementDayResponseHttpDto.fromQuery);
    return dto;
  }
}
