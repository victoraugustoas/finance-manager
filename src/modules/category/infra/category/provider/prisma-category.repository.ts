import { Result } from '@/shared/base/result';
import { RepositoryErrors } from '@/shared/errors/shared-errors';
import { CategoryType } from '@/shared/enums/category-type';
import { PrismaService } from '@/shared/infra/prisma.service';
import { Category, CategoryRepository } from '@/modules/category';

export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(entity: Category): Promise<Result<void>> {
    return this.upsert(entity);
  }

  async update(entity: Category): Promise<Result<void>> {
    return this.upsert(entity);
  }

  async findById(id: string): Promise<Result<Category>> {
    try {
      const row = await this.prisma.category.findUnique({
        where: { id },
        include: { subCategories: true },
      });
      if (!row) {
        return Result.fail(RepositoryErrors.ENTITY_NOT_FOUND);
      }

      return Category.tryCreate({
        id: row.id,
        name: row.name,
        type: row.type as CategoryType,
        subCategories: row.subCategories.map((subCategory) => ({
          id: subCategory.id,
          name: subCategory.name,
        })),
      });
    } catch {
      return Result.fail(RepositoryErrors.READ_FAILED);
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      await this.prisma.category.delete({ where: { id } });
      return Result.ok();
    } catch {
      return Result.fail(RepositoryErrors.WRITE_FAILED);
    }
  }

  private async upsert(entity: Category): Promise<Result<void>> {
    const subCategories = entity.subCategories;

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.category.upsert({
          where: { id: entity.id },
          create: {
            id: entity.id,
            name: entity.name,
            type: entity.type,
            subCategories: {
              create: subCategories.map((subCategory) => ({
                id: subCategory.id,
                name: subCategory.name,
              })),
            },
          },
          update: {
            name: entity.name,
            type: entity.type,
          },
        });

        for (const subCategory of subCategories) {
          await tx.subCategory.upsert({
            where: { id: subCategory.id },
            create: {
              id: subCategory.id,
              name: subCategory.name,
              categoryId: entity.id,
            },
            update: {
              name: subCategory.name,
            },
          });
        }

        const idsToKeep = subCategories.map((subCategory) => subCategory.id);
        await tx.subCategory.deleteMany({
          where:
            idsToKeep.length === 0
              ? { categoryId: entity.id }
              : { categoryId: entity.id, id: { notIn: idsToKeep } },
        });
      });

      return Result.ok();
    } catch {
      return Result.fail(RepositoryErrors.WRITE_FAILED);
    }
  }
}
