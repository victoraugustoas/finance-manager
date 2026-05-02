import { Result } from '@/shared/base';
import { BreakdownCategoriesDTO } from '@/reporting/core/dto/BreakdownCategories.dto';
import { ReportingPeriod } from '@/reporting/core/model/ReportingPeriod';

export interface BreakdownCategoriesQueryProps {
  categoriesId?: Array<string>;
  period: ReportingPeriod;
  effectivated: boolean;
}

export abstract class BreakdownCategoriesQuery {
  abstract execute(props: BreakdownCategoriesQueryProps): Promise<Result<BreakdownCategoriesDTO>>;
}
