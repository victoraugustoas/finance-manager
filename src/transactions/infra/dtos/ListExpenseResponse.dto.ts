import { ListExpenseResult } from '@/transactions/core/queries/ListExpense/ListExpense.result';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ListExpenseItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Groceries' })
  name!: string;

  @ApiProperty({ example: 49.9, description: 'Amount as a decimal value' })
  amount!: number;

  @ApiProperty({ format: 'uuid' })
  categoryId!: string;

  @ApiProperty({ example: 'Food' })
  categoryName!: string;

  @ApiProperty({ format: 'uuid' })
  subCategoryId!: string;

  @ApiProperty({ example: 'Groceries' })
  subCategoryName!: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  notes?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  dueDate!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  entryDate!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  paymentDate?: string;

  @ApiProperty({ example: false })
  effectivated!: boolean;

  @ApiProperty({ format: 'uuid' })
  accountId!: string;

  @ApiProperty({ example: 'Checking' })
  accountName!: string;
}

export class ListExpenseResponseDto {
  @ApiProperty({ type: [ListExpenseItemResponseDto] })
  expenses!: ListExpenseItemResponseDto[];

  static fromDomain(expenses: ListExpenseResult[]): ListExpenseResponseDto {
    const dto = new ListExpenseResponseDto();
    dto.expenses = expenses.map((expense) => {
      const item = new ListExpenseItemResponseDto();
      item.id = expense.id;
      item.name = expense.name;
      item.amount = expense.amount;
      item.categoryId = expense.categoryId;
      item.categoryName = expense.categoryName;
      item.subCategoryId = expense.subCategoryId;
      item.subCategoryName = expense.subCategoryName;
      item.notes = expense.notes;
      item.dueDate = expense.dueDate.toISOString();
      item.entryDate = expense.entryDate.toISOString();
      item.paymentDate = expense.paymentDate?.toISOString();
      item.effectivated = expense.effectivated;
      item.accountId = expense.accountId;
      item.accountName = expense.accountName;
      return item;
    });
    return dto;
  }
}
