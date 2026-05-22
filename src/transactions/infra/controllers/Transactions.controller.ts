import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';
import { RegisterExpenseDto } from '@/transactions/infra/dtos/RegisterExpense.dto';
import { RegisterExpenseResponseDto } from '@/transactions/infra/dtos/RegisterExpenseResponse.dto';
import { RegisterIncomeDto } from '@/transactions/infra/dtos/RegisterIncome.dto';
import { RegisterIncomeResponseDto } from '@/transactions/infra/dtos/RegisterIncomeResponse.dto';
import { RegisterTransferDto } from '@/transactions/infra/dtos/RegisterTransfer.dto';
import { EditExpenseDto } from '@/transactions/infra/dtos/EditExpense.dto';
import { EditIncomeDto } from '@/transactions/infra/dtos/EditIncome.dto';
import { ListTransactionsQueryDto } from '@/transactions/infra/dtos/ListTransactionsQuery.dto';
import { ListIncomeResponseDto } from '@/transactions/infra/dtos/ListIncomeResponse.dto';
import { ListExpenseResponseDto } from '@/transactions/infra/dtos/ListExpenseResponse.dto';
import { RegisterExpenseUseCase } from '@/transactions/core/usecases/RegisterExpense.usecase';
import { RegisterIncomeUseCase } from '@/transactions/core/usecases/RegisterIncome.usecase';
import { RegisterTransferUseCase } from '@/transactions/core/usecases/RegisterTransfer.usecase';
import { EditTransactionUseCase } from '@/transactions/core/usecases/EditTransaction.usecase';
import { ListIncomeUseCase } from '@/transactions/core/usecases/ListIncome.usecase';
import { ListExpenseUseCase } from '@/transactions/core/usecases/ListExpense.usecase';
import { TransactionType } from '@/shared/enums/TransactionType';
import { MapResultErrorToHttpException } from '@/shared/infra/MapResultErrorToHttpException';

@Controller('transactions')
export class TransactionsController {
  private readonly logger = new Logger(TransactionsController.name);

  constructor(
    private readonly registerExpenseUseCase: RegisterExpenseUseCase,
    private readonly registerIncomeUseCase: RegisterIncomeUseCase,
    private readonly registerTransferUseCase: RegisterTransferUseCase,
    private readonly editTransactionUseCase: EditTransactionUseCase,
    private readonly listIncomeUseCase: ListIncomeUseCase,
    private readonly listExpenseUseCase: ListExpenseUseCase,
  ) {}

  @Get('expenses')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOkResponse({ type: ListExpenseResponseDto })
  async listExpenses(@Query() query: ListTransactionsQueryDto): Promise<ListExpenseResponseDto> {
    const result = await this.listExpenseUseCase.execute({
      startDate: query.startDate !== undefined ? new Date(query.startDate) : undefined,
      endDate: query.endDate !== undefined ? new Date(query.endDate) : undefined,
    });

    if (result.isFailure) {
      this.logger.error(`Error during list expenses: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }

    return ListExpenseResponseDto.fromDomain(result.value);
  }

  @Get('incomes')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOkResponse({ type: ListIncomeResponseDto })
  async listIncomes(@Query() query: ListTransactionsQueryDto): Promise<ListIncomeResponseDto> {
    const result = await this.listIncomeUseCase.execute({
      startDate: query.startDate !== undefined ? new Date(query.startDate) : undefined,
      endDate: query.endDate !== undefined ? new Date(query.endDate) : undefined,
    });

    if (result.isFailure) {
      this.logger.error(`Error during list incomes: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }

    return ListIncomeResponseDto.fromDomain(result.value);
  }

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

  @Post('transfers')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: RegisterTransferDto })
  @ApiCreatedResponse()
  async registerTransfer(@Body() dto: RegisterTransferDto): Promise<void> {
    const result = await this.registerTransferUseCase.execute({
      name: dto.name,
      amount: dto.amount,
      dueDate: new Date(dto.dueDate),
      entryDate: new Date(dto.entryDate),
      effectivatedDate:
        dto.effectivatedDate !== undefined ? new Date(dto.effectivatedDate) : undefined,
      effectivated: dto.effectivated,
      accountIdOrigin: dto.accountIdOrigin,
      accountIdDestination: dto.accountIdDestination,
      notes: dto.notes,
    });

    if (result.isFailure) {
      this.logger.error(`Error during register transfer: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }
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
