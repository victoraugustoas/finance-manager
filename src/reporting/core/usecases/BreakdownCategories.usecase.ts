import { Result, UseCase } from '@/shared/base';
import {
  BreakdownCategoriesQuery,
  BreakdownCategoriesQueryProps,
} from '@/reporting/core/provider/BreakdownCategories.query';
import { BreakdownCategoriesDTO } from '@/reporting/core/dto/BreakdownCategories.dto';
import { ReportingPeriod } from '@/reporting/core/model/ReportingPeriod';
import { BreakdownCategoriesComposer } from '@/reporting/core/service/BreakdownCategoriesComposer';

type BreakdownCategoriesParams = Omit<BreakdownCategoriesQueryProps, 'period'> & {
  startDate: Date;
  endDate: Date;
};

export class BreakdownCategoriesUseCase implements UseCase<
  BreakdownCategoriesParams,
  BreakdownCategoriesDTO
> {
  private readonly breakdownCategoriesComposer = new BreakdownCategoriesComposer();

  constructor(private readonly breakdownCategoriesQuery: BreakdownCategoriesQuery) {}

  async execute(params: BreakdownCategoriesParams): Promise<Result<BreakdownCategoriesDTO>> {
    const period = ReportingPeriod.create({ startDate: params.startDate, endDate: params.endDate });
    if (period.isFailure) {
      return period.asFail();
    }

    const rowsResult = await this.breakdownCategoriesQuery.execute({
      ...params,
      period: period.value,
    });
    if (rowsResult.isFailure) {
      return rowsResult.asFail();
    }

    const dto = this.breakdownCategoriesComposer.applySixCategoryCap(rowsResult.value);
    return Result.ok(dto);
  }
}
