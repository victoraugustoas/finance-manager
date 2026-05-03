import { TransactionType } from 'generated/prisma/client';
import { Result } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';
import { PrismaService } from '@/shared/infra/PrismaService';
import { Expense } from '@/transactions/core/model/Expense';
import { TransactionsRepository } from '../../core/provider/Transactions.repository';

export class PrismaTransactionsRepository implements TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveExpense(expense: Expense): Promise<Result<void>> {
    try {
      await this.prisma.transaction.create({
        data: {
          id: expense.id,
          name: expense.props.name,
          amount: expense.amount.amountInCents,
          notes: expense.props.notes ?? null,
          dueDate: expense.props.dueDate,
          entryDate: expense.props.entryDate,
          effectivatedDate: expense.props.effectivatedDate ?? null,
          effectivated: expense.props.effectivated,
          type: TransactionType.EXPENSE,
          categoryId: expense.props.categoryId,
          subCategoryId: expense.props.subCategoryId,
          accountId: expense.props.accountId,
        },
      });
      return Result.ok(undefined);
    } catch (e) {
      return Result.fail({
        code: Errors.PRISMA_INSERT_ERROR,
        cls: this.constructor.name,
        data: { error: String(e) },
      });
    }
  }
}
