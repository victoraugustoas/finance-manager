import { Result } from '@/shared/base/result';
import { UseCase } from '@/shared/base/UseCase';
import { ReportingPeriod } from '@/shared/ValueObjects/reporting-period.vo';
import { BreakdownCategoriesInDTO, BreakdownCategoriesOutDTO } from '../dto';
import { BreakdownCategoriesQuery } from '../provider';
import { BreakdownCategoriesComposerService } from '../service';

/**
 * Read use case by exception: the six-category cap (BR3) and its tie-breaking rules do not fit a
 * stable SQL projection, so the query stays a plain aggregation and the rule is composed here.
 * No entity and no write repository are involved.
 */
export class FindBreakdownCategories implements UseCase<
  BreakdownCategoriesInDTO,
  BreakdownCategoriesOutDTO
> {
  constructor(
    private readonly breakdownCategories: BreakdownCategoriesQuery,
    private readonly composer: BreakdownCategoriesComposerService,
  ) {}

  async execute(input: BreakdownCategoriesInDTO): Promise<Result<BreakdownCategoriesOutDTO>> {
    const period = ReportingPeriod.tryCreate({
      startDate: input.startDate,
      endDate: input.endDate,
    });
    if (period.isFailure) {
      return period.withFail;
    }

    const rows = await this.breakdownCategories.execute({
      categoriesId: input.categoriesId,
      effectivated: input.effectivated,
      type: input.type,
      period: { startDate: period.instance.startDate, endDate: period.instance.endDate },
    });
    if (rows.isFailure) {
      return rows.withFail;
    }

    return Result.ok(this.composer.applySixCategoryCap(rows.instance));
  }
}
