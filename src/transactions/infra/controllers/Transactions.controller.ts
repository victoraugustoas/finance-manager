import { Body, Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { RegisterExpenseDto } from '@/transactions/infra/dtos/RegisterExpense.dto';
import { RegisterExpenseUseCase } from '@/transactions/core/usecases/RegisterExpense.usecase';
import { MapResultErrorToHttpException } from '@/shared/infra/MapResultErrorToHttpException';

@Controller('transactions')
export class TransactionsController {
  private readonly logger = new Logger(TransactionsController.name);

  constructor(private readonly registerExpenseUseCase: RegisterExpenseUseCase) {}

  @Post('expenses')
  @HttpCode(HttpStatus.CREATED)
  async registerExpense(@Body() dto: RegisterExpenseDto) {
    const result = await this.registerExpenseUseCase.execute({
      name: dto.name,
      amount: dto.amount,
      dueDate: new Date(dto.dueDate),
      entryDate: new Date(dto.entryDate),
      paymentDate: dto.paymentDate !== undefined ? new Date(dto.paymentDate) : undefined,
      settled: dto.settled,
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
}
