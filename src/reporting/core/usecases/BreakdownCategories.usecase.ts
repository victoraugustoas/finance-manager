import { Result, UseCase } from '@/shared/base';
import {
  BreakdownCategoriesQuery,
  BreakdownCategoriesQueryProps,
} from '@/reporting/core/provider/BreakdownCategories.query';
import { BreakdownCategoriesDTO } from '@/reporting/core/dto/BreakdownCategories.dto';
import { ReportingPeriod } from '@/reporting/core/model/ReportingPeriod';

type BreakdownCategoriesParams = Omit<BreakdownCategoriesQueryProps, 'period'> & {
  startDate: Date;
  endDate: Date;
};

export class BreakdownCategoriesUseCase implements UseCase<
  BreakdownCategoriesParams,
  BreakdownCategoriesDTO
> {
  constructor(private readonly breakdownCategoriesQuery: BreakdownCategoriesQuery) {}

  async execute(params: BreakdownCategoriesParams): Promise<Result<BreakdownCategoriesDTO>> {
    const period = ReportingPeriod.create({ startDate: params.startDate, endDate: params.endDate });
    if (period.isFailure) {
      return period.asFail();
    }
    return this.breakdownCategoriesQuery.execute({ ...params, period: period.value });
  }
}
