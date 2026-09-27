import { Result } from '@/shared/base/result';
import { CategoryBreakdownRowOutDTO } from '../dto';
import { CategoryType } from '@/shared/enums/category-type';

export interface BreakdownCategoriesQueryInput {
  categoriesId?: string[];
  period: { startDate: Date; endDate: Date };
  /** Restricts the aggregation to settled transactions when `true`. */
  effectivated: boolean;
  type: CategoryType;
}

/**
 * Aggregates transaction totals per category inside the period, sorted by total descending.
 * The six-category cap (BR3) is applied by the read use case, not here.
 * Returns an empty list when nothing matches (never `null`).
 */
export interface BreakdownCategoriesQuery {
  execute(input: BreakdownCategoriesQueryInput): Promise<Result<CategoryBreakdownRowOutDTO[]>>;
}
