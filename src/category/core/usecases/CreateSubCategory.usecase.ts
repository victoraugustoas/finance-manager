import { SubCategory } from '@/category/core/model/SubCategory';
import { CategoriesRepository } from '@/category/core/provider/categories.repository';
import { Errors } from '@/shared/base/Errors';
import { Result, UseCase } from '@/shared/base';

export type CreateSubCategoryParams = {
  categoryId: string;
  name: string;
};

export class CreateSubCategoryUseCase implements UseCase<CreateSubCategoryParams, SubCategory> {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async execute(params: CreateSubCategoryParams): Promise<Result<SubCategory>> {
    const category = await this.categoriesRepository.findById(params.categoryId);
    if (!category) {
      return Result.fail({ code: Errors.CATEGORY_NOT_FOUND });
    }

    const added = category.addSubCategory(params.name);
    if (added.isFailure) {
      return added.asFail();
    }

    const persisted = await this.categoriesRepository.save(category);
    if (persisted.isFailure) {
      return persisted.asFail();
    }

    return Result.ok(added.value);
  }
}
