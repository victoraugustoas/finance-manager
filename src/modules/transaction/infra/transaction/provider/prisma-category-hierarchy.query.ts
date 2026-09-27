import { Result } from '@/shared/base/result';
import { RepositoryErrors } from '@/shared/errors/shared-errors';
import { PrismaService } from '@/shared/infra/prisma.service';
import {
  CategoryHierarchyErrors,
  CategoryHierarchyQuery,
  CategoryHierarchyQueryInput,
} from '@/modules/transaction';

export class PrismaCategoryHierarchyQuery implements CategoryHierarchyQuery {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: CategoryHierarchyQueryInput): Promise<Result<void>> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id: input.categoryId },
        select: { type: true },
      });
      if (!category) {
        return Result.fail(CategoryHierarchyErrors.CATEGORY_NOT_FOUND);
      }
      if (category.type !== input.type) {
        return Result.fail(CategoryHierarchyErrors.CATEGORY_WRONG_TYPE);
      }

      const subCategory = await this.prisma.subCategory.findUnique({
        where: { id: input.subCategoryId },
        select: { categoryId: true },
      });
      if (!subCategory) {
        return Result.fail(CategoryHierarchyErrors.SUBCATEGORY_NOT_FOUND);
      }
      if (subCategory.categoryId !== input.categoryId) {
        return Result.fail(CategoryHierarchyErrors.SUBCATEGORY_NOT_IN_CATEGORY);
      }

      return Result.ok();
    } catch {
      return Result.fail(RepositoryErrors.READ_FAILED);
    }
  }
}
