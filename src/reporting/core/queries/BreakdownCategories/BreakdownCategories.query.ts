import { CategoryType } from '@/shared/enums/CategoryType';

export interface BreakdownCategoriesQuery {
  categoriesId?: Array<string>;
  startDate: Date;
  endDate: Date;
  effectivated: boolean;
  type: CategoryType;
}
