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

export class RegisterExpenseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @ApiProperty({ example: 'Groceries' })
  name!: string;

  @IsNumber()
  @ApiProperty({ example: 49.9 })
  amount!: number;

  @IsDateString()
  @ApiProperty({ type: String, format: 'date-time', example: '2026-01-15T12:00:00.000Z' })
  dueDate!: string;

  @IsDateString()
  @ApiProperty({ type: String, format: 'date-time', example: '2026-01-10T12:00:00.000Z' })
  entryDate!: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ type: String, format: 'date-time', example: '2026-01-12T12:00:00.000Z' })
  paymentDate?: string;

  @IsBoolean()
  @ApiProperty({ example: false })
  effectivated!: boolean;

  @IsUUID()
  @ApiProperty({ format: 'uuid' })
  accountId!: string;

  @IsUUID()
  @ApiProperty({ format: 'uuid' })
  categoryId!: string;

  @IsUUID()
  @ApiProperty({ format: 'uuid' })
  subCategoryId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @ApiPropertyOptional({ maxLength: 2000 })
  notes?: string;
}
