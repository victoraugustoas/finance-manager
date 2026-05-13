import { Result, ValueObject } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';

export interface EffectivatedProps {
  effectivated: boolean;
  effectivatedDate?: Date;
}

export class Effectivated extends ValueObject<EffectivatedProps> {
  protected constructor(props: EffectivatedProps) {
    super(props);
  }

  get effectivated(): boolean {
    return this.props.effectivated;
  }

  get effectivatedDate(): Date | undefined {
    return this.props.effectivatedDate;
  }

  static create(props: EffectivatedProps): Result<Effectivated> {
    const { effectivated, effectivatedDate } = props;

    if (effectivated && !effectivatedDate) {
      return Result.fail({ code: Errors.EFFECTIVATED_DATE_NOT_BE_NULL });
    }

    return Result.ok(new Effectivated(props));
  }

  static new(props: EffectivatedProps): Effectivated {
    return new Effectivated(props);
  }
}
