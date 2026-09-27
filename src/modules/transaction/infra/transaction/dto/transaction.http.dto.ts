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
import {
  Expense,
  ExpenseListItemOutDTO,
  Income,
  IncomeListItemOutDTO,
  TransferListItemOutDTO,
} from '@/modules/transaction';

export class ListTransactionsQueryHttpDto {
  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    example: '2026-01-01T00:00:00.000Z',
    description: 'Period start. When omitted with endDate, the current month is used.',
  })
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    example: '2026-01-31T23:59:59.999Z',
    description: 'Period end. When omitted with startDate, the current month is used.',
  })
  endDate?: string;
}

export class RegisterExpenseHttpDto {
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

export class RegisterIncomeHttpDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @ApiProperty({ example: 'Salary' })
  name!: string;

  @IsNumber()
  @ApiProperty({ example: 3500 })
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
  receiptDate?: string;

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

export class EditTransactionHttpDto {
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
  effectivatedDate?: string;

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

export class RegisterTransferHttpDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @ApiProperty({ example: 'Savings transfer' })
  name!: string;

  @IsNumber()
  @ApiProperty({ example: 150.0 })
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
  effectivatedDate?: string;

  @IsBoolean()
  @ApiProperty({ example: false })
  effectivated!: boolean;

  @IsUUID()
  @ApiProperty({ format: 'uuid' })
  accountIdOrigin!: string;

  @IsUUID()
  @ApiProperty({ format: 'uuid' })
  accountIdDestination!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @ApiPropertyOptional({ maxLength: 2000 })
  notes?: string;
}

export class RegisterExpenseResponseHttpDto {
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

  static fromDomain(expense: Expense): RegisterExpenseResponseHttpDto {
    const dto = new RegisterExpenseResponseHttpDto();
    dto.id = expense.id;
    dto.name = expense.name;
    dto.amount = expense.amount.amount;
    dto.categoryId = expense.categoryId;
    dto.subCategoryId = expense.subCategoryId;
    dto.notes = expense.props.notes;
    dto.dueDate = expense.props.dueDate.toISOString();
    dto.entryDate = expense.props.entryDate.toISOString();
    dto.effectivatedDate = expense.props.effectivatedDate?.toISOString();
    dto.effectivated = expense.props.effectivated;
    dto.accountId = expense.accountId;
    return dto;
  }
}

export class RegisterIncomeResponseHttpDto {
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

  static fromDomain(income: Income): RegisterIncomeResponseHttpDto {
    const dto = new RegisterIncomeResponseHttpDto();
    dto.id = income.id;
    dto.name = income.name;
    dto.amount = income.amount.amount;
    dto.categoryId = income.categoryId;
    dto.subCategoryId = income.subCategoryId;
    dto.notes = income.props.notes;
    dto.dueDate = income.props.dueDate.toISOString();
    dto.entryDate = income.props.entryDate.toISOString();
    dto.effectivatedDate = income.props.effectivatedDate?.toISOString();
    dto.effectivated = income.props.effectivated;
    dto.accountId = income.accountId;
    return dto;
  }
}

export class ListExpenseItemResponseHttpDto {
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

export class ListExpenseResponseHttpDto {
  @ApiProperty({ type: [ListExpenseItemResponseHttpDto] })
  expenses!: ListExpenseItemResponseHttpDto[];

  static fromQuery(expenses: ExpenseListItemOutDTO[]): ListExpenseResponseHttpDto {
    const dto = new ListExpenseResponseHttpDto();
    dto.expenses = expenses.map((expense) => {
      const item = new ListExpenseItemResponseHttpDto();
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

export class ListIncomeItemResponseHttpDto {
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

export class ListIncomeResponseHttpDto {
  @ApiProperty({ type: [ListIncomeItemResponseHttpDto] })
  incomes!: ListIncomeItemResponseHttpDto[];

  static fromQuery(incomes: IncomeListItemOutDTO[]): ListIncomeResponseHttpDto {
    const dto = new ListIncomeResponseHttpDto();
    dto.incomes = incomes.map((income) => {
      const item = new ListIncomeItemResponseHttpDto();
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

export class ListTransfersItemResponseHttpDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Savings transfer' })
  name!: string;

  @ApiProperty({ example: 150, description: 'Amount as a decimal value' })
  amount!: number;

  @ApiPropertyOptional({ maxLength: 2000 })
  notes?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  dueDate!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  entryDate!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  effectivatedDate?: string;

  @ApiProperty({ example: false })
  effectivated!: boolean;

  @ApiProperty({ format: 'uuid' })
  accountIdOrigin!: string;

  @ApiProperty({ example: 'Checking' })
  accountOriginName!: string;

  @ApiProperty({ format: 'uuid' })
  accountIdDestination!: string;

  @ApiProperty({ example: 'Savings' })
  accountDestinationName!: string;
}

export class ListTransfersResponseHttpDto {
  @ApiProperty({ type: [ListTransfersItemResponseHttpDto] })
  transfers!: ListTransfersItemResponseHttpDto[];

  static fromQuery(transfers: TransferListItemOutDTO[]): ListTransfersResponseHttpDto {
    const dto = new ListTransfersResponseHttpDto();
    dto.transfers = transfers.map((transfer) => {
      const item = new ListTransfersItemResponseHttpDto();
      item.id = transfer.id;
      item.name = transfer.name;
      item.amount = transfer.amount;
      item.notes = transfer.notes;
      item.dueDate = transfer.dueDate.toISOString();
      item.entryDate = transfer.entryDate.toISOString();
      item.effectivatedDate = transfer.effectivatedDate?.toISOString();
      item.effectivated = transfer.effectivated;
      item.accountIdOrigin = transfer.accountIdOrigin;
      item.accountOriginName = transfer.accountOriginName;
      item.accountIdDestination = transfer.accountIdDestination;
      item.accountDestinationName = transfer.accountDestinationName;
      return item;
    });
    return dto;
  }
}
