import { TransactionType } from 'generated/prisma/client';
import { Result } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';
import { PrismaService } from '@/shared/infra/PrismaService';
import { Expense } from '@/transactions/core/model/Expense';
import { Income } from '@/transactions/core/model/Income';
import { TransactionsRepository } from '../../core/provider/Transactions.repository';
import { saveWithOutbox } from '@/shared/events/infra/saveWithOutbox';

export class PrismaTransactionsRepository implements TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveExpense(expense: Expense): Promise<Result<void>> {
    try {
      await saveWithOutbox(this.prisma, expense.domainEvents, async (tx) => {
        await tx.transaction.upsert({
          where: { id: expense.id },
          create: {
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
          update: {
            name: expense.props.name,
            amount: expense.amount.amountInCents,
            notes: expense.props.notes ?? null,
            dueDate: expense.props.dueDate,
            entryDate: expense.props.entryDate,
            effectivatedDate: expense.props.effectivatedDate ?? null,
            effectivated: expense.props.effectivated,
            categoryId: expense.props.categoryId,
            subCategoryId: expense.props.subCategoryId,
            accountId: expense.props.accountId,
          },
        });
      });
      expense.clearDomainEvents();
      return Result.ok(undefined);
    } catch (e) {
      return Result.fail({
        code: Errors.PRISMA_INSERT_ERROR,
        cls: this.constructor.name,
        data: { error: String(e) },
      });
    }
  }

  async saveIncome(income: Income): Promise<Result<void>> {
    try {
      await saveWithOutbox(this.prisma, income.domainEvents, async (tx) => {
        await tx.transaction.upsert({
          where: { id: income.id },
          create: {
            id: income.id,
            name: income.props.name,
            amount: income.amount.amountInCents,
            notes: income.props.notes ?? null,
            dueDate: income.props.dueDate,
            entryDate: income.props.entryDate,
            effectivatedDate: income.props.effectivatedDate ?? null,
            effectivated: income.props.effectivated,
            type: TransactionType.INCOME,
            categoryId: income.props.categoryId,
            subCategoryId: income.props.subCategoryId,
            accountId: income.props.accountId,
          },
          update: {
            name: income.props.name,
            amount: income.amount.amountInCents,
            notes: income.props.notes ?? null,
            dueDate: income.props.dueDate,
            entryDate: income.props.entryDate,
            effectivatedDate: income.props.effectivatedDate ?? null,
            effectivated: income.props.effectivated,
            categoryId: income.props.categoryId,
            subCategoryId: income.props.subCategoryId,
            accountId: income.props.accountId,
          },
        });
      });
      income.clearDomainEvents();
      return Result.ok(undefined);
    } catch (e) {
      return Result.fail({
        code: Errors.PRISMA_INSERT_ERROR,
        cls: this.constructor.name,
        data: { error: String(e) },
      });
    }
  }

  async findIncomeById(id: string): Promise<Result<Income>> {
    try {
      const raw = await this.prisma.transaction.findFirst({
        where: { id, type: TransactionType.INCOME },
      });
      if (!raw)
        return Result.fail({
          code: Errors.PRISMA_QUERY_ERROR,
          cls: this.constructor.name,
          data: { id },
        });
      return Result.ok(
        Income.new({
          id: raw.id,
          name: raw.name,
          amount: raw.amount / 100,
          notes: raw.notes ?? undefined,
          dueDate: raw.dueDate,
          entryDate: raw.entryDate,
          effectivatedDate: raw.effectivatedDate ?? undefined,
          effectivated: raw.effectivated,
          categoryId: raw.categoryId,
          subCategoryId: raw.subCategoryId,
          accountId: raw.accountId,
        }),
      );
    } catch (e) {
      return Result.fail({
        code: Errors.PRISMA_QUERY_ERROR,
        cls: this.constructor.name,
        data: { error: String(e) },
      });
    }
  }

  async findExpenseById(id: string): Promise<Result<Expense>> {
    try {
      const raw = await this.prisma.transaction.findFirst({
        where: { id, type: TransactionType.EXPENSE },
      });
      if (!raw)
        return Result.fail({
          code: Errors.PRISMA_QUERY_ERROR,
          cls: this.constructor.name,
          data: { id },
        });
      return Result.ok(
        Expense.new({
          id: raw.id,
          name: raw.name,
          amount: raw.amount / 100,
          notes: raw.notes ?? undefined,
          dueDate: raw.dueDate,
          entryDate: raw.entryDate,
          effectivatedDate: raw.effectivatedDate ?? undefined,
          effectivated: raw.effectivated,
          categoryId: raw.categoryId,
          subCategoryId: raw.subCategoryId,
          accountId: raw.accountId,
        }),
      );
    } catch (e) {
      return Result.fail({
        code: Errors.PRISMA_QUERY_ERROR,
        cls: this.constructor.name,
        data: { error: String(e) },
      });
    }
  }
}
