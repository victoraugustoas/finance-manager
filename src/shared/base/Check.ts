import { Result, ResultError } from './Result';

export class Check {
  /** Succeeds when `value > min`. */
  static gt(value: number, min: number, error: ResultError): Result<void> {
    return value > min ? Result.ok() : Result.fail(error);
  }

  /** Succeeds when `value >= min`. */
  static gte(value: number, min: number, error: ResultError): Result<void> {
    return value >= min ? Result.ok() : Result.fail(error);
  }

  /** Succeeds when `value < max`. */
  static lt(value: number, max: number, error: ResultError): Result<void> {
    return value < max ? Result.ok() : Result.fail(error);
  }

  /** Succeeds when `value <= max`. */
  static lte(value: number, max: number, error: ResultError): Result<void> {
    return value <= max ? Result.ok() : Result.fail(error);
  }

  /** Succeeds when the string is not empty or whitespace-only. */
  static notEmpty(value: string, error: ResultError): Result<void> {
    return value.trim().length > 0 ? Result.ok() : Result.fail(error);
  }

  /** Succeeds when the value is neither `null` nor `undefined`. */
  static notNull(value: unknown, error: ResultError): Result<void> {
    return value != null ? Result.ok() : Result.fail(error);
  }

  /** Succeeds when the condition is `true`. */
  static isTrue(condition: boolean, error: ResultError): Result<void> {
    return condition ? Result.ok() : Result.fail(error);
  }
}
