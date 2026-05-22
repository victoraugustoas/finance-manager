import { Category } from '@/category/core/model/Category';
import { CategoryType } from '@/shared/enums/CategoryType';
import { CategoriesRepository } from '@/category/core/provider/categories.repository';
import { Result, UseCase } from '@/shared/base';

export type ListIncomeCategoriesParams = Record<string, never>;

export class ListIncomeCategoriesUseCase implements UseCase<
  ListIncomeCategoriesParams,
  Category[]
> {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async execute(_params: ListIncomeCategoriesParams = {}): Promise<Result<Category[]>> {
    const categories = await this.categoriesRepository.findAllByType(CategoryType.INCOME);
    if (categories.isFailure) return categories.asFail();

    return Result.ok(categories.value);
  }
}
