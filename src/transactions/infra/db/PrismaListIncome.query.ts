import { Result } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';
import { PrismaService } from '@/shared/infra/PrismaService';
import {
  ListIncomeQuery,
  ListIncomeQueryProps,
  ListIncomeQueryResult,
} from '@/transactions/core/provider/ListIncome.query';
import { TransactionType } from 'generated/prisma/client';

export class PrismaListIncomeQuery implements ListIncomeQuery {
  constructor(private readonly prisma: PrismaService) {}

  async execute(props: ListIncomeQueryProps): Promise<Result<ListIncomeQueryResult[]>> {
    try {
      const rawIncomes = await this.prisma.transaction.findMany({
        where: {
          type: TransactionType.INCOME,
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
        rawIncomes.map((raw) => ({
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
          receiptDate: raw.effectivatedDate ?? undefined,
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
