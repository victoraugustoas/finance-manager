import { Result } from '@/shared/base/result';
import { Category } from '../model';

export interface CategoryRepository {
  create(entity: Category): Promise<Result<void>>;
  /** Persists the category and its subcategories, dropping subcategories no longer present. */
  update(entity: Category): Promise<Result<void>>;
  /** Fails with `ENTITY_NOT_FOUND` when there is no category with the given id. */
  findById(id: string): Promise<Result<Category>>;
  delete(id: string): Promise<Result<void>>;
}
