import { Category } from '@/category/core/model/Category';
import { CategoryType } from '@/shared/enums/CategoryType';
import { CategoriesRepository } from '@/category/core/ports/repositories/Categories.repository';
import { Result } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';
import { PrismaService } from '@/shared/infra/PrismaService';
import { saveWithOutbox } from '@/shared/events/infra/saveWithOutbox';

export class PrismaCategoriesRepository implements CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(category: Category): Promise<Result<void>> {
    try {
      await saveWithOutbox(this.prisma, category.domainEvents, async (tx) => {
        await tx.category.upsert({
          where: { id: category.id },
          create: {
            id: category.id,
            name: category.name,
            type: category.type,
            subCategories: {
              create: category.subCategories.map((s) => ({
                id: s.id,
                name: s.name,
              })),
            },
          },
          update: {
            name: category.name,
            type: category.type,
          },
        });

        for (const s of category.subCategories) {
          await tx.subCategory.upsert({
            where: { id: s.id },
            create: {
              id: s.id,
              name: s.name,
              categoryId: category.id,
            },
            update: {
              name: s.name,
            },
          });
        }

        const idsToKeep = category.subCategories.map((s) => s.id);
        if (idsToKeep.length === 0) {
          await tx.subCategory.deleteMany({ where: { categoryId: category.id } });
        } else {
          await tx.subCategory.deleteMany({
            where: {
              categoryId: category.id,
              id: { notIn: idsToKeep },
            },
          });
        }
      });
      category.clearDomainEvents();
      return Result.ok(undefined);
    } catch (e) {
      return Result.fail({
        code: Errors.PRISMA_INSERT_ERROR,
        cls: this.constructor.name,
        data: { error: String(e) },
      });
    }
  }

  async findById(id: string): Promise<Category | null> {
    const row = await this.prisma.category.findUnique({
      where: { id },
      include: { subCategories: true },
    });
    if (!row) {
      return null;
    }
    return Category.new({
      id: row.id,
      name: row.name,
      type: row.type as CategoryType,
      subCategories: row.subCategories.map((s) => ({ id: s.id, name: s.name })),
    });
  }

  async findAll(): Promise<Result<Category[]>> {
    try {
      const rows = await this.prisma.category.findMany({
        include: { subCategories: true },
      });
      const categories = rows.map((row) =>
        Category.new({
          id: row.id,
          name: row.name,
          type: row.type as CategoryType,
          subCategories: row.subCategories.map((s) => ({ id: s.id, name: s.name })),
        }),
      );
      return Result.ok(categories);
    } catch (e) {
      return Result.fail({
        code: Errors.PRISMA_QUERY_ERROR,
        cls: this.constructor.name,
        data: { error: String(e) },
      });
    }
  }

  async findAllByType(type: CategoryType): Promise<Result<Category[]>> {
    try {
      const rows = await this.prisma.category.findMany({
        where: { type },
        include: { subCategories: true },
      });
      const categories = rows.map((row) =>
        Category.new({
          id: row.id,
          name: row.name,
          type: row.type as CategoryType,
          subCategories: row.subCategories.map((s) => ({ id: s.id, name: s.name })),
        }),
      );
      return Result.ok(categories);
    } catch (e) {
      return Result.fail({
        code: Errors.PRISMA_QUERY_ERROR,
        cls: this.constructor.name,
        data: { error: String(e) },
      });
    }
  }
}
