import { Result } from '@/shared/base/result';
import { UseCase } from '@/shared/base/UseCase';
import { CreateSubCategoryInDTO } from '../dto';
import { Category, SubCategory } from '../model';
import { CategoryRepository } from '../provider';

export class CreateSubCategory implements UseCase<CreateSubCategoryInDTO, SubCategory> {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(input: CreateSubCategoryInDTO): Promise<Result<SubCategory>> {
    const category = await this.categoryRepository.findById(input.categoryId);
    if (category.isFailure) {
      return Result.fail(Category.NOT_FOUND);
    }

    const subCategory = category.instance.addSubCategory(input.name);
    if (subCategory.isFailure) {
      return subCategory.withFail;
    }

    const persisted = await this.categoryRepository.update(category.instance);
    if (persisted.isFailure) {
      return persisted.withFail;
    }

    return Result.ok(subCategory.instance);
  }
}
