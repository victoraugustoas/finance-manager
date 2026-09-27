import { Result } from '@/shared/base/result';
import { RepositoryErrors } from '@/shared/errors/shared-errors';
import { Category, CategoryRepository } from '@/modules/category';

export class InMemoryCategoryRepository implements CategoryRepository {
  private readonly items = new Map<string, Category>();

  async create(entity: Category): Promise<Result<void>> {
    this.items.set(entity.id, entity);
    return Result.ok();
  }

  async update(entity: Category): Promise<Result<void>> {
    this.items.set(entity.id, entity);
    return Result.ok();
  }

  async findById(id: string): Promise<Result<Category>> {
    const entity = this.items.get(id);

    if (!entity) {
      return Result.fail(RepositoryErrors.ENTITY_NOT_FOUND);
    }

    return Result.ok(entity);
  }

  async delete(id: string): Promise<Result<void>> {
    this.items.delete(id);
    return Result.ok();
  }
}
