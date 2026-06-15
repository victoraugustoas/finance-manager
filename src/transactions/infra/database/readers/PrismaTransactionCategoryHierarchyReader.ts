import { PrismaService } from '@/shared/infra/PrismaService';
import { Result } from '@/shared/base/Result';
import { Errors } from '@/shared/base/Errors';
import { CategoryType } from 'generated/prisma/client';
import { TransactionCategoryHierarchyReader } from '@/transactions/core/ports/acl/TransactionCategoryHierarchy.reader';

export class PrismaTransactionCategoryHierarchyReader implements TransactionCategoryHierarchyReader {
  constructor(private readonly prisma: PrismaService) {}

  ensureIncomeHierarchy(categoryId: string, subCategoryId: string): Promise<Result<void>> {
    return this.ensureHierarchy(categoryId, subCategoryId, CategoryType.INCOME);
  }

  ensureExpenseHierarchy(categoryId: string, subCategoryId: string): Promise<Result<void>> {
    return this.ensureHierarchy(categoryId, subCategoryId, CategoryType.EXPENSE);
  }

  private async ensureHierarchy(
    categoryId: string,
    subCategoryId: string,
    expectedType: CategoryType,
  ): Promise<Result<void>> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
        select: { type: true },
      });
      if (!category) {
        return Result.fail({
          code: Errors.REFERENCE_CATEGORY_NOT_FOUND,
          cls: this.constructor.name,
          data: { categoryId },
        });
      }
      if (category.type !== expectedType) {
        return Result.fail({
          code: Errors.REFERENCE_CATEGORY_WRONG_TYPE,
          cls: this.constructor.name,
          data: { categoryId, expectedType },
        });
      }

      const subCategory = await this.prisma.subCategory.findUnique({
        where: { id: subCategoryId },
        select: { categoryId: true },
      });
      if (!subCategory) {
        return Result.fail({
          code: Errors.REFERENCE_SUBCATEGORY_NOT_FOUND,
          cls: this.constructor.name,
          data: { subCategoryId },
        });
      }
      if (subCategory.categoryId !== categoryId) {
        return Result.fail({
          code: Errors.REFERENCE_SUBCATEGORY_NOT_IN_CATEGORY,
          cls: this.constructor.name,
          data: { categoryId, subCategoryId },
        });
      }

      return Result.ok(undefined);
    } catch (e) {
      return Result.fail({
        code: Errors.PRISMA_QUERY_ERROR,
        cls: this.constructor.name,
        data: { categoryId, subCategoryId, error: String(e) },
      });
    }
  }
}
