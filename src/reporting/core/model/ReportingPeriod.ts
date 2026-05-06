import { Result, ValueObject } from '@/shared/base';
import { endOfDay, isAfter, isSameDay, startOfDay } from 'date-fns';
import { Errors } from '@/shared/base/Errors';

interface ReportingPeriodProps {
  startDate: Date;
  endDate: Date;
}

export class ReportingPeriod extends ValueObject<ReportingPeriodProps> {
  private constructor(props: ReportingPeriodProps) {
    super(props);
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date {
    return this.props.endDate;
  }

  static create(props: ReportingPeriodProps): Result<ReportingPeriod> {
    const endDateIsAfterStartDate =
      isAfter(props.endDate, props.startDate) || isSameDay(props.startDate, props.endDate);
    if (!endDateIsAfterStartDate) {
      return Result.fail({ code: Errors.END_DATE_NOT_AFTER_START_DATE });
    }
    return Result.ok(
      new ReportingPeriod({
        startDate: startOfDay(props.startDate),
        endDate: endOfDay(props.endDate),
      }),
    );
  }
}
