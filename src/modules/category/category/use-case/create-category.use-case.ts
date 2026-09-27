import { Result } from '@/shared/base/result';
import { UseCase } from '@/shared/base/UseCase';
import { CreateCategoryInDTO } from '../dto';
import { Category } from '../model';
import { CategoryRepository } from '../provider';

export class CreateCategory implements UseCase<CreateCategoryInDTO, Category> {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(input: CreateCategoryInDTO): Promise<Result<Category>> {
    const category = Category.tryCreate({ name: input.name, type: input.type });
    if (category.isFailure) {
      return category.withFail;
    }

    const created = await this.categoryRepository.create(category.instance);
    if (created.isFailure) {
      return created.withFail;
    }

    return Result.ok(category.instance);
  }
}
