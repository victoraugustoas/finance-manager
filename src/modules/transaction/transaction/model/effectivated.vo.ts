import { Result } from '@/shared/base/result';
import { resolveVoConfig, ValueObject, ValueObjectConfig } from '@/shared/base/vo';

export interface EffectivatedProps {
  effectivated: boolean;
  effectivatedDate?: Date;
}

/** Settlement state of a transaction: an effectivated movement requires its date. */
export class Effectivated extends ValueObject<EffectivatedProps, ValueObjectConfig> {
  static readonly DATE_REQUIRED = 'EFFECTIVATED_DATE_NOT_BE_NULL';

  private constructor(props: EffectivatedProps, config?: ValueObjectConfig) {
    super(props, config);
  }

  get effectivated(): boolean {
    return this.value.effectivated;
  }

  get effectivatedDate(): Date | undefined {
    return this.value.effectivatedDate;
  }

  static create(props: EffectivatedProps, config?: ValueObjectConfig): Effectivated {
    const result = Effectivated.tryCreate(props, config);
    result.validator.throwsIfFailed();
    return result.instance;
  }

  static tryCreate(props: EffectivatedProps, config?: ValueObjectConfig): Result<Effectivated> {
    if (props.effectivated && !props.effectivatedDate) {
      return Result.fail(Effectivated.DATE_REQUIRED);
    }

    return Result.ok(new Effectivated(props, resolveVoConfig(config)));
  }

  override equals(vo: ValueObject<EffectivatedProps, ValueObjectConfig>): boolean {
    return (
      this.effectivated === vo.value.effectivated &&
      this.effectivatedDate?.getTime() === vo.value.effectivatedDate?.getTime()
    );
  }
}
