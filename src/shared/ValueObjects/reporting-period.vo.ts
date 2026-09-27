import { Result } from '@/shared/base/result';
import { resolveVoConfig, ValueObject, ValueObjectConfig } from '@/shared/base/vo';
import { PeriodErrors } from '@/shared/errors/shared-errors';
import { endOfDay, endOfMonth, isAfter, isSameDay, startOfDay, startOfMonth } from 'date-fns';

export interface ReportingPeriodProps {
  startDate: Date;
  endDate: Date;
}

/** Closed date range used by reporting and transaction listings. */
export class ReportingPeriod extends ValueObject<ReportingPeriodProps, ValueObjectConfig> {
  static readonly END_DATE_NOT_AFTER_START_DATE = PeriodErrors.END_DATE_NOT_AFTER_START_DATE;

  private constructor(props: ReportingPeriodProps, config?: ValueObjectConfig) {
    super(props, config);
  }

  get startDate(): Date {
    return this.value.startDate;
  }

  get endDate(): Date {
    return this.value.endDate;
  }

  static create(props: ReportingPeriodProps, config?: ValueObjectConfig): ReportingPeriod {
    const result = ReportingPeriod.tryCreate(props, config);
    result.validator.throwsIfFailed();
    return result.instance;
  }

  static tryCreate(
    props: ReportingPeriodProps,
    config?: ValueObjectConfig,
  ): Result<ReportingPeriod> {
    const endDateIsAfterStartDate =
      isAfter(props.endDate, props.startDate) || isSameDay(props.startDate, props.endDate);
    if (!endDateIsAfterStartDate) {
      return Result.fail(ReportingPeriod.END_DATE_NOT_AFTER_START_DATE);
    }

    return Result.ok(
      new ReportingPeriod(
        {
          startDate: startOfDay(props.startDate),
          endDate: endOfDay(props.endDate),
        },
        resolveVoConfig(config),
      ),
    );
  }

  /** Falls back to the current month when a boundary is omitted by the caller. */
  static tryCreateWithCurrentMonthFallback(
    props: Partial<ReportingPeriodProps>,
    config?: ValueObjectConfig,
  ): Result<ReportingPeriod> {
    const today = new Date();

    return ReportingPeriod.tryCreate(
      {
        startDate: props.startDate ?? startOfMonth(today),
        endDate: props.endDate ?? endOfMonth(today),
      },
      config,
    );
  }

  override equals(vo: ValueObject<ReportingPeriodProps, ValueObjectConfig>): boolean {
    return (
      this.startDate.getTime() === vo.value.startDate.getTime() &&
      this.endDate.getTime() === vo.value.endDate.getTime()
    );
  }
}
