import { Category } from '@/category/core/model/Category';
import { CategoryType } from '@/shared/enums/CategoryType';
import { Result } from '@/shared/base';

export abstract class CategoriesRepository {
  abstract save(category: Category): Promise<Result<void>>;

  abstract findById(id: string): Promise<Category | null>;

  abstract findAll(): Promise<Result<Category[]>>;

  abstract findAllByType(type: CategoryType): Promise<Result<Category[]>>;
}
