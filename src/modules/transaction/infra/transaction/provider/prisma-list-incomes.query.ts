import { Result } from '@/shared/base/result';
import { RepositoryErrors } from '@/shared/errors/shared-errors';
import { PrismaService } from '@/shared/infra/prisma.service';
import { ReportingPeriod } from '@/shared/ValueObjects/reporting-period.vo';
import {
  IncomeListItemOutDTO,
  ListIncomesQuery,
  ListTransactionsQueryInDTO,
} from '@/modules/transaction';
import { TransactionType } from 'generated/prisma/client';

export class PrismaListIncomesQuery implements ListIncomesQuery {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: ListTransactionsQueryInDTO): Promise<Result<IncomeListItemOutDTO[]>> {
    const period = ReportingPeriod.tryCreateWithCurrentMonthFallback(input);
    if (period.isFailure) {
      return period.withFail;
    }

    try {
      const rows = await this.prisma.transaction.findMany({
        where: {
          type: TransactionType.INCOME,
          entryDate: {
            gte: period.instance.startDate,
            lte: period.instance.endDate,
          },
        },
        include: { category: true, subCategory: true, account: true },
        orderBy: { entryDate: 'desc' },
      });

      return Result.ok(
        rows.map((row) => ({
          id: row.id,
          name: row.name,
          amount: row.amount / 100,
          categoryId: row.categoryId,
          categoryName: row.category.name,
          subCategoryId: row.subCategoryId,
          subCategoryName: row.subCategory.name,
          notes: row.notes ?? undefined,
          dueDate: row.dueDate,
          entryDate: row.entryDate,
          receiptDate: row.effectivatedDate ?? undefined,
          effectivated: row.effectivated,
          accountId: row.accountId,
          accountName: row.account.name,
        })),
      );
    } catch {
      return Result.fail(RepositoryErrors.READ_FAILED);
    }
  }
}
