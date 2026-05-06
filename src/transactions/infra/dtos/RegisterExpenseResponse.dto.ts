import { Expense } from '@/transactions/core/model/Expense';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterExpenseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Groceries' })
  name!: string;

  @ApiProperty({ example: 49.9, description: 'Amount as a decimal value' })
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
    description: 'Payment date when effectivated',
  })
  effectivatedDate?: string;

  @ApiProperty({ example: false })
  effectivated!: boolean;

  @ApiProperty({ format: 'uuid' })
  accountId!: string;

  static fromDomain(expense: Expense): RegisterExpenseResponseDto {
    const dto = new RegisterExpenseResponseDto();
    dto.id = expense.id;
    dto.name = expense.props.name;
    dto.amount = expense.amount.amount;
    dto.categoryId = expense.props.categoryId;
    dto.subCategoryId = expense.props.subCategoryId;
    dto.notes = expense.props.notes;
    dto.dueDate = expense.props.dueDate.toISOString();
    dto.entryDate = expense.props.entryDate.toISOString();
    dto.effectivatedDate = expense.props.effectivatedDate?.toISOString();
    dto.effectivated = expense.props.effectivated;
    dto.accountId = expense.props.accountId;
    return dto;
  }
}
