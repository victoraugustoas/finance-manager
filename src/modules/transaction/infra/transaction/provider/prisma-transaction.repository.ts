import { Result } from '@/shared/base/result';
import { RepositoryErrors } from '@/shared/errors/shared-errors';
import { TransactionType } from '@/shared/enums/transaction-type';
import { saveWithOutbox } from '@/shared/events/infra/save-with-outbox';
import { PrismaService } from '@/shared/infra/prisma.service';
import { Expense, Income, Transaction, TransactionRepository } from '@/modules/transaction';
import { TransactionType as PrismaTransactionType } from 'generated/prisma/client';

type TransactionRow = {
  id: string;
  name: string;
  amount: number;
  notes: string | null;
  dueDate: Date;
  entryDate: Date;
  effectivatedDate: Date | null;
  effectivated: boolean;
  type: PrismaTransactionType;
  categoryId: string;
  subCategoryId: string;
  accountId: string;
};

export class PrismaTransactionRepository implements TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(entity: Transaction<Expense> | Transaction<Income>): Promise<Result<void>> {
    return this.upsert(entity);
  }

  async update(entity: Transaction<Expense> | Transaction<Income>): Promise<Result<void>> {
    return this.upsert(entity);
  }

  async findById(id: string): Promise<Result<Expense | Income>> {
    try {
      const row = await this.prisma.transaction.findUnique({ where: { id } });
      if (!row) {
        return Result.fail(RepositoryErrors.ENTITY_NOT_FOUND);
      }

      return row.type === PrismaTransactionType.INCOME
        ? Income.tryCreate(PrismaTransactionRepository.toDomainProps(row))
        : Expense.tryCreate(PrismaTransactionRepository.toDomainProps(row));
    } catch {
      return Result.fail(RepositoryErrors.READ_FAILED);
    }
  }

  async findExpenseById(id: string): Promise<Result<Expense>> {
    try {
      const row = await this.prisma.transaction.findFirst({
        where: { id, type: PrismaTransactionType.EXPENSE },
      });
      if (!row) {
        return Result.fail(RepositoryErrors.ENTITY_NOT_FOUND);
      }

      return Expense.tryCreate(PrismaTransactionRepository.toDomainProps(row));
    } catch {
      return Result.fail(RepositoryErrors.READ_FAILED);
    }
  }

  async findIncomeById(id: string): Promise<Result<Income>> {
    try {
      const row = await this.prisma.transaction.findFirst({
        where: { id, type: PrismaTransactionType.INCOME },
      });
      if (!row) {
        return Result.fail(RepositoryErrors.ENTITY_NOT_FOUND);
      }

      return Income.tryCreate(PrismaTransactionRepository.toDomainProps(row));
    } catch {
      return Result.fail(RepositoryErrors.READ_FAILED);
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      await this.prisma.transaction.delete({ where: { id } });
      return Result.ok();
    } catch {
      return Result.fail(RepositoryErrors.WRITE_FAILED);
    }
  }

  private static toDomainProps(row: TransactionRow) {
    return {
      id: row.id,
      name: row.name,
      amount: row.amount,
      notes: row.notes ?? undefined,
      dueDate: row.dueDate,
      entryDate: row.entryDate,
      effectivatedDate: row.effectivatedDate ?? undefined,
      effectivated: row.effectivated,
      categoryId: row.categoryId,
      subCategoryId: row.subCategoryId,
      accountId: row.accountId,
    };
  }

  private async upsert(entity: Transaction<Expense> | Transaction<Income>): Promise<Result<void>> {
    const data = {
      name: entity.name,
      amount: entity.amount.amountInCents,
      notes: entity.props.notes ?? null,
      dueDate: entity.props.dueDate,
      entryDate: entity.props.entryDate,
      effectivatedDate: entity.props.effectivatedDate ?? null,
      effectivated: entity.props.effectivated,
      categoryId: entity.categoryId,
      subCategoryId: entity.subCategoryId,
      accountId: entity.accountId,
    };

    try {
      await saveWithOutbox(this.prisma, entity.peekEvents(), async (tx) => {
        await tx.transaction.upsert({
          where: { id: entity.id },
          create: {
            id: entity.id,
            type:
              entity.type === TransactionType.INCOME
                ? PrismaTransactionType.INCOME
                : PrismaTransactionType.EXPENSE,
            ...data,
          },
          update: data,
        });
      });
      entity.clearEvents();
      return Result.ok();
    } catch {
      return Result.fail(RepositoryErrors.WRITE_FAILED);
    }
  }
}
