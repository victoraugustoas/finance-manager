import { QueryHandler, Result } from '@/shared/base';
import { BreakdownCategoriesReader } from '@/reporting/core/ports/readers/BreakdownCategoriesReader';
import { BreakdownCategoriesQuery } from './BreakdownCategories.query';
import { BreakdownCategoriesResult } from './BreakdownCategories.result';
import { ReportingPeriod } from '@/shared/ValueObjects';
import { BreakdownCategoriesComposer } from '@/reporting/core/service/BreakdownCategoriesComposer';

export class BreakdownCategoriesHandler implements QueryHandler<
  BreakdownCategoriesQuery,
  BreakdownCategoriesResult
> {
  private readonly breakdownCategoriesComposer = new BreakdownCategoriesComposer();

  constructor(private readonly breakdownCategoriesReader: BreakdownCategoriesReader) {}

  async handle(query: BreakdownCategoriesQuery): Promise<Result<BreakdownCategoriesResult>> {
    const period = ReportingPeriod.create({ startDate: query.startDate, endDate: query.endDate });
    if (period.isFailure) {
      return period.asFail();
    }

    const rowsResult = await this.breakdownCategoriesReader.read({
      ...query,
      period: period.value,
    });
    if (rowsResult.isFailure) {
      return rowsResult.asFail();
    }

    const dto = this.breakdownCategoriesComposer.applySixCategoryCap(rowsResult.value);
    return Result.ok(dto);
  }
}
