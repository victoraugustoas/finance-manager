import { Module } from '@nestjs/common';
import { PrismaService } from '@/shared/infra/prisma.service';
import { CreateCategory, CreateSubCategory } from '@/modules/category';
import { CategoryController } from './category/category.controller';
import { PrismaCategoryRepository } from './category/provider/prisma-category.repository';
import { PrismaListCategoriesQuery } from './category/provider/prisma-list-categories.query';

@Module({
  controllers: [CategoryController],
  providers: [
    PrismaService,
    {
      provide: PrismaCategoryRepository,
      useFactory: (prisma: PrismaService) => new PrismaCategoryRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: PrismaListCategoriesQuery,
      useFactory: (prisma: PrismaService) => new PrismaListCategoriesQuery(prisma),
      inject: [PrismaService],
    },
    {
      provide: CreateCategory,
      useFactory: (repository: PrismaCategoryRepository) => new CreateCategory(repository),
      inject: [PrismaCategoryRepository],
    },
    {
      provide: CreateSubCategory,
      useFactory: (repository: PrismaCategoryRepository) => new CreateSubCategory(repository),
      inject: [PrismaCategoryRepository],
    },
  ],
})
export class CategoryModule {}
