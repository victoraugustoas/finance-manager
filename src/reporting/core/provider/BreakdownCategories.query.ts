import { Result } from '@/shared/base';
import type { CategoryBreakdownRow } from '@/reporting/core/service/BreakdownCategoriesComposer';
import { ReportingPeriod } from '@/shared/ValueObjects';
import { CategoryType } from '@/shared/enums/CategoryType';

export interface BreakdownCategoriesQueryProps {
  categoriesId?: Array<string>;
  period: ReportingPeriod;
  effectivated: boolean;
  type: CategoryType;
}

export abstract class BreakdownCategoriesQuery {
  abstract execute(props: BreakdownCategoriesQueryProps): Promise<Result<CategoryBreakdownRow[]>>;
}
