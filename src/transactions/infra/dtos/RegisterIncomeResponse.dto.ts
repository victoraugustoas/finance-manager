import { Income } from '@/transactions/core/model/Income';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterIncomeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Salary' })
  name!: string;

  @ApiProperty({ example: 3500, description: 'Amount as a decimal value' })
  amount!: number;

  @ApiProperty({ format: 'uuid' })
  categoryId!: string;

  @ApiProperty({ format: 'uuid' })
  subCategoryId!: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  notes?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  dueDate!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  entryDate!: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Receipt date when effectivated',
  })
  effectivatedDate?: string;

  @ApiProperty({ example: false })
  effectivated!: boolean;

  @ApiProperty({ format: 'uuid' })
  accountId!: string;

  static fromDomain(income: Income): RegisterIncomeResponseDto {
    const dto = new RegisterIncomeResponseDto();
    dto.id = income.id;
    dto.name = income.props.name;
    dto.amount = income.amount.amount;
    dto.categoryId = income.props.categoryId;
    dto.subCategoryId = income.props.subCategoryId;
    dto.notes = income.props.notes;
    dto.dueDate = income.props.dueDate.toISOString();
    dto.entryDate = income.props.entryDate.toISOString();
    dto.effectivatedDate = income.props.effectivatedDate?.toISOString();
    dto.effectivated = income.props.effectivated;
    dto.accountId = income.props.accountId;
    return dto;
  }
}
