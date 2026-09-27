import { ResultError } from '@/shared/base/result-error';
import { ResultErrors } from '@/shared/errors/shared-errors';

export type ResultValidationError = string | string[] | Error;
export type ResultExceptionFactory = (error: ResultValidationError) => unknown;

type ResultValidationSource<T> = {
  readonly instance: T;
  readonly isFailure: boolean;
  readonly errors?: string[];
};

export class ResultValidator<
  T,
  TSource extends ResultValidationSource<T> = ResultValidationSource<T>,
> {
  constructor(private readonly source: TSource) {}

  get result(): TSource {
    return this.source;
  }

  throwsIfTrue(
    this: ResultValidator<boolean, any>,
    error: ResultValidationError = ResultErrors.EXPRESSION_TRUE,
    exceptionFactory?: ResultExceptionFactory,
  ) {
    if (this.source.instance === true) {
      this.throwError(error, exceptionFactory);
    }

    return this;
  }

  throwsIfFalse(
    this: ResultValidator<boolean, any>,
    error: ResultValidationError = ResultErrors.EXPRESSION_FALSE,
    exceptionFactory?: ResultExceptionFactory,
  ) {
    if (this.source.instance === false) {
      this.throwError(error, exceptionFactory);
    }

    return this;
  }

  throwsIfNull(
    error: ResultValidationError = ResultErrors.INSTANCE_NULL,
    exceptionFactory?: ResultExceptionFactory,
  ): this {
    if (this.source.instance == null) {
      this.throwError(error, exceptionFactory);
    }

    return this;
  }

  throwsIfNotNull(
    error: ResultValidationError = ResultErrors.INSTANCE_NOT_NULL,
    exceptionFactory?: ResultExceptionFactory,
  ): this {
    if (this.source.instance != null) {
      this.throwError(error, exceptionFactory);
    }

    return this;
  }

  throwsIfEmpty(
    error: ResultValidationError = ResultErrors.INSTANCE_EMPTY,
    exceptionFactory?: ResultExceptionFactory,
  ): this {
    if (this.source.instance instanceof Array && this.source.instance.length === 0) {
      this.throwError(error, exceptionFactory);
    }

    return this;
  }

  throwsIfNotEmpty(
    error: ResultValidationError = ResultErrors.INSTANCE_NOT_EMPTY,
    exceptionFactory?: ResultExceptionFactory,
  ): this {
    if (this.source.instance instanceof Array && this.source.instance.length > 0) {
      this.throwError(error, exceptionFactory);
    }

    return this;
  }

  throwsIfFailed(
    error: ResultValidationError = this.source.errors ?? ResultErrors.FAILED,
    exceptionFactory?: ResultExceptionFactory,
  ): this {
    if (this.source.isFailure) {
      this.throwError(error, exceptionFactory);
    }

    return this;
  }

  private throwError(
    error: ResultValidationError,
    exceptionFactory?: ResultExceptionFactory,
  ): never {
    if (exceptionFactory) {
      throw exceptionFactory(error);
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new ResultError(error);
  }
}
