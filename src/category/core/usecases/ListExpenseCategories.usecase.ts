import { Category } from '@/category/core/model/Category';
import { CategoryType } from '@/shared/enums/CategoryType';
import { CategoriesRepository } from '@/category/core/provider/categories.repository';
import { Result, UseCase } from '@/shared/base';

export type ListExpenseCategoriesParams = Record<string, never>;

export class ListExpenseCategoriesUseCase implements UseCase<
  ListExpenseCategoriesParams,
  Category[]
> {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async execute(_params: ListExpenseCategoriesParams = {}): Promise<Result<Category[]>> {
    const categories = await this.categoriesRepository.findAllByType(CategoryType.EXPENSE);
    if (categories.isFailure) return categories.asFail();

    return Result.ok(categories.value);
  }
}
