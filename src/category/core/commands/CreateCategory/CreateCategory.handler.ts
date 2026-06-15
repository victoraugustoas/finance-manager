import { Category } from '@/category/core/model/Category';
import { CategoriesRepository } from '@/category/core/ports/repositories/Categories.repository';
import { CommandHandler, Result } from '@/shared/base';
import { CreateCategoryCommand } from './CreateCategory.command';

export class CreateCategoryHandler implements CommandHandler<CreateCategoryCommand, Category> {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async handle(command: CreateCategoryCommand): Promise<Result<Category>> {
    const created = Category.create(command);
    if (created.isFailure) {
      return created.asFail();
    }

    const persisted = await this.categoriesRepository.save(created.value);
    if (persisted.isFailure) {
      return persisted.asFail();
    }

    return Result.ok(created.value);
  }
}
