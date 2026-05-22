import { ListIncomeQueryResult } from '@/transactions/core/provider/ListIncome.query';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ListIncomeItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Salary' })
  name!: string;

  @ApiProperty({ example: 3500, description: 'Amount as a decimal value' })
  amount!: number;

  @ApiProperty({ format: 'uuid' })
  categoryId!: string;

  @ApiProperty({ example: 'Work' })
  categoryName!: string;

  @ApiProperty({ format: 'uuid' })
  subCategoryId!: string;

  @ApiProperty({ example: 'Monthly salary' })
  subCategoryName!: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  notes?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  dueDate!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  entryDate!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  receiptDate?: string;

  @ApiProperty({ example: false })
  effectivated!: boolean;

  @ApiProperty({ format: 'uuid' })
  accountId!: string;

  @ApiProperty({ example: 'Checking' })
  accountName!: string;
}

export class ListIncomeResponseDto {
  @ApiProperty({ type: [ListIncomeItemResponseDto] })
  incomes!: ListIncomeItemResponseDto[];

  static fromDomain(incomes: ListIncomeQueryResult[]): ListIncomeResponseDto {
    const dto = new ListIncomeResponseDto();
    dto.incomes = incomes.map((income) => {
      const item = new ListIncomeItemResponseDto();
      item.id = income.id;
      item.name = income.name;
      item.amount = income.amount;
      item.categoryId = income.categoryId;
      item.categoryName = income.categoryName;
      item.subCategoryId = income.subCategoryId;
      item.subCategoryName = income.subCategoryName;
      item.notes = income.notes;
      item.dueDate = income.dueDate.toISOString();
      item.entryDate = income.entryDate.toISOString();
      item.receiptDate = income.receiptDate?.toISOString();
      item.effectivated = income.effectivated;
      item.accountId = income.accountId;
      item.accountName = income.accountName;
      return item;
    });
    return dto;
  }
}
