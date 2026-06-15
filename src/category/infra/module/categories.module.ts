import { CategoriesController } from '@/category/infra/controllers/Categories.controller';
import { CategoriesRepository } from '@/category/core/ports/repositories/Categories.repository';
import { Module } from '@nestjs/common';
import { PrismaCategoriesRepository } from '@/category/infra/database/repositories/PrismaCategories.repository';
import { PrismaService } from '@/shared/infra/PrismaService';
import { CreateCategoryHandler } from '@/category/core/commands/CreateCategory/CreateCategory.handler';
import { CreateSubCategoryHandler } from '@/category/core/commands/CreateSubCategory/CreateSubCategory.handler';
import { ListIncomeCategoriesHandler } from '@/category/core/queries/ListIncomeCategories/ListIncomeCategories.handler';
import { ListExpenseCategoriesHandler } from '@/category/core/queries/ListExpenseCategories/ListExpenseCategories.handler';

@Module({
  imports: [],
  controllers: [CategoriesController],
  providers: [
    PrismaService,
    {
      provide: CategoriesRepository,
      useFactory: (prisma: PrismaService) => new PrismaCategoriesRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: CreateCategoryHandler,
      useFactory: (repo: CategoriesRepository) => new CreateCategoryHandler(repo),
      inject: [CategoriesRepository],
    },
    {
      provide: CreateSubCategoryHandler,
      useFactory: (repo: CategoriesRepository) => new CreateSubCategoryHandler(repo),
      inject: [CategoriesRepository],
    },
    {
      provide: ListIncomeCategoriesHandler,
      useFactory: (repo: CategoriesRepository) => new ListIncomeCategoriesHandler(repo),
      inject: [CategoriesRepository],
    },
    {
      provide: ListExpenseCategoriesHandler,
      useFactory: (repo: CategoriesRepository) => new ListExpenseCategoriesHandler(repo),
      inject: [CategoriesRepository],
    },
  ],
})
export class CategoriesModule {}
