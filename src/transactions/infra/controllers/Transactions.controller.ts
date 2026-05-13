import { Body, Controller, HttpCode, HttpStatus, Logger, Param, Post, Put } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiParam } from '@nestjs/swagger';
import { RegisterExpenseDto } from '@/transactions/infra/dtos/RegisterExpense.dto';
import { RegisterExpenseResponseDto } from '@/transactions/infra/dtos/RegisterExpenseResponse.dto';
import { RegisterIncomeDto } from '@/transactions/infra/dtos/RegisterIncome.dto';
import { RegisterIncomeResponseDto } from '@/transactions/infra/dtos/RegisterIncomeResponse.dto';
import { EditExpenseDto } from '@/transactions/infra/dtos/EditExpense.dto';
import { EditIncomeDto } from '@/transactions/infra/dtos/EditIncome.dto';
import { RegisterExpenseUseCase } from '@/transactions/core/usecases/RegisterExpense.usecase';
import { RegisterIncomeUseCase } from '@/transactions/core/usecases/RegisterIncome.usecase';
import { EditTransactionUseCase } from '@/transactions/core/usecases/EditTransaction.usecase';
import { TransactionType } from '@/transactions/core/model/Transaction';
import { MapResultErrorToHttpException } from '@/shared/infra/MapResultErrorToHttpException';

@Controller('transactions')
export class TransactionsController {
  private readonly logger = new Logger(TransactionsController.name);

  constructor(
    private readonly registerExpenseUseCase: RegisterExpenseUseCase,
    private readonly registerIncomeUseCase: RegisterIncomeUseCase,
    private readonly editTransactionUseCase: EditTransactionUseCase,
  ) {}

  @Post('expenses')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: RegisterExpenseDto })
  @ApiCreatedResponse({ type: RegisterExpenseResponseDto })
  async registerExpense(@Body() dto: RegisterExpenseDto): Promise<RegisterExpenseResponseDto> {
    const result = await this.registerExpenseUseCase.execute({
      name: dto.name,
      amount: dto.amount,
      dueDate: new Date(dto.dueDate),
      entryDate: new Date(dto.entryDate),
      paymentDate: dto.paymentDate !== undefined ? new Date(dto.paymentDate) : undefined,
      effectivated: dto.effectivated,
      accountId: dto.accountId,
      categoryId: dto.categoryId,
      subCategoryId: dto.subCategoryId,
      notes: dto.notes,
    });

    if (result.isFailure) {
      this.logger.error(`Error during register expense: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }
    return RegisterExpenseResponseDto.fromDomain(result.value);
  }

  @Post('incomes')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: RegisterIncomeDto })
  @ApiCreatedResponse({ type: RegisterIncomeResponseDto })
  async registerIncome(@Body() dto: RegisterIncomeDto): Promise<RegisterIncomeResponseDto> {
    const result = await this.registerIncomeUseCase.execute({
      name: dto.name,
      amount: dto.amount,
      dueDate: new Date(dto.dueDate),
      entryDate: new Date(dto.entryDate),
      receiptDate: dto.receiptDate !== undefined ? new Date(dto.receiptDate) : undefined,
      effectivated: dto.effectivated,
      accountId: dto.accountId,
      categoryId: dto.categoryId,
      subCategoryId: dto.subCategoryId,
      notes: dto.notes,
    });

    if (result.isFailure) {
      this.logger.error(`Error during register income: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }
    return RegisterIncomeResponseDto.fromDomain(result.value);
  }

  @Put('expenses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: EditExpenseDto })
  @ApiNoContentResponse()
  async editExpense(@Param('id') id: string, @Body() dto: EditExpenseDto): Promise<void> {
    const result = await this.editTransactionUseCase.execute({
      id,
      type: TransactionType.EXPENSE,
      name: dto.name,
      amount: dto.amount,
      dueDate: new Date(dto.dueDate),
      entryDate: new Date(dto.entryDate),
      effectivatedDate:
        dto.effectivatedDate !== undefined ? new Date(dto.effectivatedDate) : undefined,
      effectivated: dto.effectivated,
      accountId: dto.accountId,
      categoryId: dto.categoryId,
      subCategoryId: dto.subCategoryId,
      notes: dto.notes,
    });

    if (result.isFailure) {
      this.logger.error(`Error during edit expense: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }
  }

  @Put('incomes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: EditIncomeDto })
  @ApiNoContentResponse()
  async editIncome(@Param('id') id: string, @Body() dto: EditIncomeDto): Promise<void> {
    const result = await this.editTransactionUseCase.execute({
      id,
      type: TransactionType.INCOME,
      name: dto.name,
      amount: dto.amount,
      dueDate: new Date(dto.dueDate),
      entryDate: new Date(dto.entryDate),
      effectivatedDate:
        dto.effectivatedDate !== undefined ? new Date(dto.effectivatedDate) : undefined,
      effectivated: dto.effectivated,
      accountId: dto.accountId,
      categoryId: dto.categoryId,
      subCategoryId: dto.subCategoryId,
      notes: dto.notes,
    });

    if (result.isFailure) {
      this.logger.error(`Error during edit income: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }
  }
}
