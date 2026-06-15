import { Result } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';
import { PrismaService } from '@/shared/infra/PrismaService';
import {
  ListExpenseReader,
  ListExpenseReaderInput,
} from '@/transactions/core/ports/readers/ListExpenseReader';
import { ListExpenseResult } from '@/transactions/core/queries/ListExpense/ListExpense.result';
import { TransactionType } from 'generated/prisma/client';

export class PrismaListExpenseReader implements ListExpenseReader {
  constructor(private readonly prisma: PrismaService) {}

  async read(props: ListExpenseReaderInput): Promise<Result<ListExpenseResult[]>> {
    try {
      const rawExpenses = await this.prisma.transaction.findMany({
        where: {
          type: TransactionType.EXPENSE,
          entryDate: {
            gte: props.period.startDate,
            lte: props.period.endDate,
          },
        },
        include: {
          category: true,
          subCategory: true,
          account: true,
        },
        orderBy: { entryDate: 'desc' },
      });

      return Result.ok(
        rawExpenses.map((raw) => ({
          id: raw.id,
          name: raw.name,
          amount: raw.amount / 100,
          categoryId: raw.categoryId,
          categoryName: raw.category.name,
          subCategoryId: raw.subCategoryId,
          subCategoryName: raw.subCategory.name,
          notes: raw.notes ?? undefined,
          dueDate: raw.dueDate,
          entryDate: raw.entryDate,
          paymentDate: raw.effectivatedDate ?? undefined,
          effectivated: raw.effectivated,
          accountId: raw.accountId,
          accountName: raw.account.name,
        })),
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
