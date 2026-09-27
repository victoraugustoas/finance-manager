import { Result } from '@/shared/base/result';
import { CategoryType } from '@/shared/enums/category-type';
import { CategoryOutDTO } from '../dto';

export interface ListCategoriesQueryInput {
  type: CategoryType;
}

/**
 * Lists every category of a single type with its subcategories.
 * No pagination: the catalog is small and consumers render it whole.
 * Ordering follows the database default; an empty list is returned when nothing matches
 * (never `null`).
 */
export interface ListCategoriesQuery {
  execute(input: ListCategoriesQueryInput): Promise<Result<CategoryOutDTO[]>>;
}
