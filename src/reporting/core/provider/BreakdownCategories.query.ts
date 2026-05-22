import { Result } from '@/shared/base';
import type { CategoryBreakdownRow } from '@/reporting/core/service/BreakdownCategoriesComposer';
import { ReportingPeriod } from '@/shared/ValueObjects';

export interface BreakdownCategoriesQueryProps {
  categoriesId?: Array<string>;
  period: ReportingPeriod;
  effectivated: boolean;
}

export abstract class BreakdownCategoriesQuery {
  abstract execute(props: BreakdownCategoriesQueryProps): Promise<Result<CategoryBreakdownRow[]>>;
}
