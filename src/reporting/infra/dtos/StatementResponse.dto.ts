import {
  StatementDayResult,
  StatementEntryResult,
  StatementResult,
} from '@/reporting/core/queries/Statement/Statement.result';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class StatementAccountResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Nubank' })
  name!: string;
}

class StatementCategoryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Salary' })
  name!: string;
}

class StatementBalanceImpactResponseDto {
  @ApiProperty({ enum: ['IN', 'OUT', 'NEUTRAL'] })
  direction!: 'IN' | 'OUT' | 'NEUTRAL';

  @ApiProperty({ example: -45.9 })
  amount!: number;
}

class StatementEntryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ['INCOME', 'EXPENSE', 'TRANSFER'] })
  movementType!: StatementEntryResult['movementType'];

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

  @ApiPropertyOptional({ type: StatementAccountResponseDto })
  account?: StatementAccountResponseDto;

  @ApiPropertyOptional({ type: StatementAccountResponseDto })
  originAccount?: StatementAccountResponseDto;

  @ApiPropertyOptional({ type: StatementAccountResponseDto })
  destinationAccount?: StatementAccountResponseDto;

  @ApiPropertyOptional({ type: StatementCategoryResponseDto })
  category?: StatementCategoryResponseDto;

  @ApiPropertyOptional({ type: StatementCategoryResponseDto })
  subCategory?: StatementCategoryResponseDto;

  @ApiProperty({ type: StatementBalanceImpactResponseDto })
  balanceImpact!: StatementBalanceImpactResponseDto;

  @ApiProperty({
    example: true,
    description: 'Whether this entry was included in the calculated balance for its statement day.',
  })
  includedInBalance!: boolean;

  static fromDomain(entry: StatementEntryResult): StatementEntryResponseDto {
    const dto = new StatementEntryResponseDto();
    dto.id = entry.id;
    dto.movementType = entry.movementType;
    dto.name = entry.name;
    dto.amount = entry.amount.amount;
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
      amount: entry.balanceImpact.amount.amount,
    };
    dto.includedInBalance = entry.includedInBalance;
    return dto;
  }
}

class StatementDayResponseDto {
  @ApiProperty({ type: String, format: 'date-time' })
  date!: string;

  @ApiProperty({ example: 1550.25 })
  balance!: number;

  @ApiProperty({ type: [StatementEntryResponseDto] })
  entries!: StatementEntryResponseDto[];

  static fromDomain(day: StatementDayResult): StatementDayResponseDto {
    const dto = new StatementDayResponseDto();
    dto.date = day.date.toISOString();
    dto.balance = day.balance.amount;
    dto.entries = day.entries.map(StatementEntryResponseDto.fromDomain);
    return dto;
  }
}

export class StatementResponseDto {
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

  @ApiProperty({ type: [StatementDayResponseDto] })
  days!: StatementDayResponseDto[];

  static fromDomain(statement: StatementResult): StatementResponseDto {
    const dto = new StatementResponseDto();
    dto.startDate = statement.startDate.toISOString();
    dto.endDate = statement.endDate.toISOString();
    dto.accountId = statement.accountId;
    dto.initialBalance = statement.initialBalance.amount;
    dto.finalBalance = statement.finalBalance.amount;
    dto.days = statement.days.map(StatementDayResponseDto.fromDomain);
    return dto;
  }
}
