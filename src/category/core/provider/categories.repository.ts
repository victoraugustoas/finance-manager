import { Category } from '@/category/core/model/Category';
import { Result } from '@/shared/base';

export abstract class CategoriesRepository {
  abstract save(category: Category): Promise<Result<void>>;

  abstract findById(id: string): Promise<Category | null>;
}
