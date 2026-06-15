import { SubCategory } from '@/category/core/model/SubCategory';
import { CategoriesRepository } from '@/category/core/ports/repositories/Categories.repository';
import { Errors } from '@/shared/base/Errors';
import { CommandHandler, Result } from '@/shared/base';

import { CreateSubCategoryCommand } from './CreateSubCategory.command';

export class CreateSubCategoryHandler implements CommandHandler<
  CreateSubCategoryCommand,
  SubCategory
> {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async handle(command: CreateSubCategoryCommand): Promise<Result<SubCategory>> {
    const category = await this.categoriesRepository.findById(command.categoryId);
    if (!category) {
      return Result.fail({ code: Errors.CATEGORY_NOT_FOUND });
    }

    const added = category.addSubCategory(command.name);
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
