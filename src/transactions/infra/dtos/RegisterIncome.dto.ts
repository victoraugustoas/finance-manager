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

export class RegisterIncomeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsNumber()
  amount!: number;

  @IsDateString()
  dueDate!: string;

  @IsDateString()
  entryDate!: string;

  @IsOptional()
  @IsDateString()
  receiptDate?: string;

  @IsBoolean()
  effectivated!: boolean;

  @IsUUID()
  accountId!: string;

  @IsUUID()
  categoryId!: string;

  @IsUUID()
  subCategoryId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
