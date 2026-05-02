import { Category, CategoryProps } from '@/category/core/model/Category';
import { CategoriesRepository } from '@/category/core/provider/categories.repository';
import { Result, UseCase } from '@/shared/base';

type CreateCategoryParams = Omit<CategoryProps, 'id'>;

export class CreateCategoryUseCase implements UseCase<CreateCategoryParams, void> {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async execute(params: CreateCategoryParams): Promise<Result<void>> {
    const created = Category.create(params);
    if (created.isFailure) {
      return created.asFail();
    }

    const persisted = await this.categoriesRepository.save(created.value);
    if (persisted.isFailure) {
      return persisted.asFail();
    }

    return Result.ok(undefined);
  }
}
