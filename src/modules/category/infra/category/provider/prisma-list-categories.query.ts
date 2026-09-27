import { Result } from '@/shared/base/result';
import { RepositoryErrors } from '@/shared/errors/shared-errors';
import { CategoryType } from '@/shared/enums/category-type';
import { PrismaService } from '@/shared/infra/prisma.service';
import { CategoryOutDTO, ListCategoriesQuery, ListCategoriesQueryInput } from '@/modules/category';

export class PrismaListCategoriesQuery implements ListCategoriesQuery {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: ListCategoriesQueryInput): Promise<Result<CategoryOutDTO[]>> {
    try {
      const rows = await this.prisma.category.findMany({
        where: { type: input.type },
        include: { subCategories: true },
      });

      return Result.ok(
        rows.map((row) => ({
          id: row.id,
          name: row.name,
          type: row.type as CategoryType,
          subCategories: row.subCategories.map((subCategory) => ({
            id: subCategory.id,
            name: subCategory.name,
          })),
        })),
      );
    } catch {
      return Result.fail(RepositoryErrors.READ_FAILED);
    }
  }
}
