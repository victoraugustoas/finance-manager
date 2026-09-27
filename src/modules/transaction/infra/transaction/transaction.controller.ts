import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
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
import { TransactionType } from '@/shared/enums/transaction-type';
import { MapResultErrorToHttpException } from '@/shared/infra/map-result-error-to-http-exception';
import {
  EditTransaction,
  ListExpensesQuery,
  ListIncomesQuery,
  ListTransfersQuery,
  RegisterExpense,
  RegisterIncome,
  RegisterTransfer,
} from '@/modules/transaction';
import {
  EditTransactionHttpDto,
  ListExpenseResponseHttpDto,
  ListIncomeResponseHttpDto,
  ListTransactionsQueryHttpDto,
  ListTransfersResponseHttpDto,
  RegisterExpenseHttpDto,
  RegisterExpenseResponseHttpDto,
  RegisterIncomeHttpDto,
  RegisterIncomeResponseHttpDto,
  RegisterTransferHttpDto,
} from './dto/transaction.http.dto';
import { PrismaListExpensesQuery } from './provider/prisma-list-expenses.query';
import { PrismaListIncomesQuery } from './provider/prisma-list-incomes.query';
import { PrismaListTransfersQuery } from './provider/prisma-list-transfers.query';

@Controller('transactions')
export class TransactionController {
  private readonly logger = new Logger(TransactionController.name);

  constructor(
    private readonly registerExpense: RegisterExpense,
    private readonly registerIncome: RegisterIncome,
    private readonly registerTransfer: RegisterTransfer,
    private readonly editTransaction: EditTransaction,
    @Inject(PrismaListExpensesQuery) private readonly listExpenses: ListExpensesQuery,
    @Inject(PrismaListIncomesQuery) private readonly listIncomes: ListIncomesQuery,
    @Inject(PrismaListTransfersQuery) private readonly listTransfers: ListTransfersQuery,
  ) {}

  @Get('expenses')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOkResponse({ type: ListExpenseResponseHttpDto })
  async listExpensesRoute(
    @Query() query: ListTransactionsQueryHttpDto,
  ): Promise<ListExpenseResponseHttpDto> {
    const result = await this.listExpenses.execute(TransactionController.toPeriod(query));
    if (result.isFailure) {
      this.logger.error(`Error during list expenses: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }

    return ListExpenseResponseHttpDto.fromQuery(result.instance);
  }

  @Get('incomes')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOkResponse({ type: ListIncomeResponseHttpDto })
  async listIncomesRoute(
    @Query() query: ListTransactionsQueryHttpDto,
  ): Promise<ListIncomeResponseHttpDto> {
    const result = await this.listIncomes.execute(TransactionController.toPeriod(query));
    if (result.isFailure) {
      this.logger.error(`Error during list incomes: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }

    return ListIncomeResponseHttpDto.fromQuery(result.instance);
  }

  @Get('transfers')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOkResponse({ type: ListTransfersResponseHttpDto })
  async listTransfersRoute(
    @Query() query: ListTransactionsQueryHttpDto,
  ): Promise<ListTransfersResponseHttpDto> {
    const result = await this.listTransfers.execute(TransactionController.toPeriod(query));
    if (result.isFailure) {
      this.logger.error(`Error during list transfers: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }

    return ListTransfersResponseHttpDto.fromQuery(result.instance);
  }

  @Post('expenses')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: RegisterExpenseHttpDto })
  @ApiCreatedResponse({ type: RegisterExpenseResponseHttpDto })
  async registerExpenseRoute(
    @Body() dto: RegisterExpenseHttpDto,
  ): Promise<RegisterExpenseResponseHttpDto> {
    const result = await this.registerExpense.execute({
      name: dto.name,
      amount: dto.amount,
      dueDate: new Date(dto.dueDate),
      entryDate: new Date(dto.entryDate),
      effectivatedDate: dto.paymentDate !== undefined ? new Date(dto.paymentDate) : undefined,
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

    return RegisterExpenseResponseHttpDto.fromDomain(result.instance);
  }

  @Post('incomes')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: RegisterIncomeHttpDto })
  @ApiCreatedResponse({ type: RegisterIncomeResponseHttpDto })
  async registerIncomeRoute(
    @Body() dto: RegisterIncomeHttpDto,
  ): Promise<RegisterIncomeResponseHttpDto> {
    const result = await this.registerIncome.execute({
      name: dto.name,
      amount: dto.amount,
      dueDate: new Date(dto.dueDate),
      entryDate: new Date(dto.entryDate),
      effectivatedDate: dto.receiptDate !== undefined ? new Date(dto.receiptDate) : undefined,
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

    return RegisterIncomeResponseHttpDto.fromDomain(result.instance);
  }

  @Post('transfers')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: RegisterTransferHttpDto })
  @ApiCreatedResponse()
  async registerTransferRoute(@Body() dto: RegisterTransferHttpDto): Promise<void> {
    const result = await this.registerTransfer.execute({
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
  @ApiBody({ type: EditTransactionHttpDto })
  @ApiNoContentResponse()
  async editExpense(@Param('id') id: string, @Body() dto: EditTransactionHttpDto): Promise<void> {
    await this.edit(id, TransactionType.EXPENSE, dto, 'edit expense');
  }

  @Put('incomes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: EditTransactionHttpDto })
  @ApiNoContentResponse()
  async editIncome(@Param('id') id: string, @Body() dto: EditTransactionHttpDto): Promise<void> {
    await this.edit(id, TransactionType.INCOME, dto, 'edit income');
  }

  private async edit(
    id: string,
    type: TransactionType,
    dto: EditTransactionHttpDto,
    operation: string,
  ): Promise<void> {
    const result = await this.editTransaction.execute({
      id,
      type,
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
      this.logger.error(`Error during ${operation}: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }
  }

  private static toPeriod(query: ListTransactionsQueryHttpDto) {
    return {
      startDate: query.startDate !== undefined ? new Date(query.startDate) : undefined,
      endDate: query.endDate !== undefined ? new Date(query.endDate) : undefined,
    };
  }
}
