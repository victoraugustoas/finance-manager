import { Body, Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { RegisterExpenseDto } from '@/transactions/infra/dtos/RegisterExpense.dto';
import { RegisterIncomeDto } from '@/transactions/infra/dtos/RegisterIncome.dto';
import { RegisterExpenseUseCase } from '@/transactions/core/usecases/RegisterExpense.usecase';
import { RegisterIncomeUseCase } from '@/transactions/core/usecases/RegisterIncome.usecase';
import { MapResultErrorToHttpException } from '@/shared/infra/MapResultErrorToHttpException';

@Controller('transactions')
export class TransactionsController {
  private readonly logger = new Logger(TransactionsController.name);

  constructor(
    private readonly registerExpenseUseCase: RegisterExpenseUseCase,
    private readonly registerIncomeUseCase: RegisterIncomeUseCase,
  ) {}

  @Post('expenses')
  @HttpCode(HttpStatus.CREATED)
  async registerExpense(@Body() dto: RegisterExpenseDto) {
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
      const { code, cls, data, message } = result.error;
      this.logger.error(
        `Error during register expense: ${JSON.stringify({ code, cls, data, message })}`,
      );
      MapResultErrorToHttpException.throwException(result);
    }
  }

  @Post('incomes')
  @HttpCode(HttpStatus.CREATED)
  async registerIncome(@Body() dto: RegisterIncomeDto) {
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
      const { code, cls, data, message } = result.error;
      this.logger.error(
        `Error during register income: ${JSON.stringify({ code, cls, data, message })}`,
      );
      MapResultErrorToHttpException.throwException(result);
    }
  }
}
