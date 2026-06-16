import { Result } from '@/shared/base';
import type { CategoryBreakdownRow } from '@/reporting/core/service/BreakdownCategoriesComposer/BreakdownCategoriesComposer';
import { ReportingPeriod } from '@/shared/ValueObjects';
import { CategoryType } from '@/shared/enums/CategoryType';

export interface BreakdownCategoriesReadParams {
  categoriesId?: Array<string>;
  period: ReportingPeriod;
  effectivated: boolean;
  type: CategoryType;
}

export abstract class BreakdownCategoriesReader {
  abstract read(params: BreakdownCategoriesReadParams): Promise<Result<CategoryBreakdownRow[]>>;
}
