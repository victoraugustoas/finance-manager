import { CategoriesRepository } from '@/category/core/provider/categories.repository';
import { Errors } from '@/shared/base/Errors';
import { Result, UseCase } from '@/shared/base';

export type CreateSubCategoryParams = {
  categoryId: string;
  name: string;
};

export class CreateSubCategoryUseCase implements UseCase<CreateSubCategoryParams, void> {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async execute(params: CreateSubCategoryParams): Promise<Result<void>> {
    const category = await this.categoriesRepository.findById(params.categoryId);
    if (!category) {
      return Result.fail({ code: Errors.CATEGORY_NOT_FOUND });
    }

    const added = category.addSubCategory(params.name);
    if (added.isFailure) {
      return added.asFail();
    }

    return this.categoriesRepository.save(category);
  }
}
