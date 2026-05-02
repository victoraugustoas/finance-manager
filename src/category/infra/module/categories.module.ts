import { CategoriesController } from '@/category/infra/controllers/Categories.controller';
import { CategoriesRepository } from '@/category/core/provider/categories.repository';
import { Module } from '@nestjs/common';
import { PrismaCategoriesRepository } from '@/category/infra/db/PrismaCategories.repository';
import { PrismaService } from '@/shared/infra/PrismaService';
import { CreateCategoryUseCase } from '@/category/core/usecases/CreateCategory.usecase';
import { CreateSubCategoryUseCase } from '@/category/core/usecases/CreateSubCategory.usecase';

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
      provide: CreateCategoryUseCase,
      useFactory: (repo: CategoriesRepository) => new CreateCategoryUseCase(repo),
      inject: [CategoriesRepository],
    },
    {
      provide: CreateSubCategoryUseCase,
      useFactory: (repo: CategoriesRepository) => new CreateSubCategoryUseCase(repo),
      inject: [CategoriesRepository],
    },
  ],
})
export class CategoriesModule {}
