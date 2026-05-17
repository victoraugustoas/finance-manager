import type { Errors } from './Errors';

export type ResultError = {
  message?: string;
  code: Errors;
  cls?: string;
  data?: Record<string, any>;
};

function normalizeErrors(errorOrErrors: ResultError | readonly ResultError[]): ResultError[] {
  return ([] as ResultError[]).concat(errorOrErrors as ResultError[] | ResultError);
}

export class Result<T> {
  private readonly _value?: T;
  private readonly _errors?: ResultError[];

  private constructor(
    private readonly _isSuccess: boolean,
    value?: T,
    errors?: ResultError[],
  ) {
    this._value = value;
    this._errors = errors;
  }

  get isSuccess(): boolean {
    return this._isSuccess;
  }

  get isFailure(): boolean {
    return !this._isSuccess;
  }

  get value(): T {
    if (!this._isSuccess) {
      throw new Error(
        'Cannot get value of a failed Result. Check isSuccess before accessing value.',
      );
    }
    return this._value as T;
  }

  get errors(): ResultError[] {
    if (this._isSuccess) {
      throw new Error(
        'Cannot get errors of a successful Result. Check isFailure before accessing errors.',
      );
    }
    return this._errors as ResultError[];
  }

  static ok<T>(value?: T): Result<T> {
    return new Result<T>(true, value);
  }

  static fail<T>(errorOrErrors: ResultError | readonly ResultError[]): Result<T> {
    return new Result<T>(false, undefined, normalizeErrors(errorOrErrors));
  }

  /**
   * Combines multiple Results; returns failure on the first error found.
   */
  static combine(results: Result<unknown>[]): Result<any> {
    for (const result of results) {
      if (result.isFailure) {
        return Result.fail<void>(result._errors!);
      }
    }
    return Result.ok<void>();
  }

  asFail(): Result<any> {
    return Result.fail<void>(this._errors!);
  }

  throwIfError(): void {
    if (this.isFailure) {
      throw this._errors;
    }
  }
}
