import { Errors } from './Errors';

export type ResultError = {
  message?: string;
  code: Errors;
  cls?: string;
};

export class Result<T> {
  private readonly _value?: T;
  private readonly _error?: ResultError;

  private constructor(
    private readonly _isSuccess: boolean,
    value?: T,
    error?: ResultError,
  ) {
    this._value = value;
    this._error = error;
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

  get error(): ResultError {
    if (this._isSuccess) {
      throw new Error(
        'Cannot get error of a successful Result. Check isFailure before accessing error.',
      );
    }
    return this._error as ResultError;
  }

  static ok<T>(value?: T): Result<T> {
    return new Result<T>(true, value);
  }

  static fail<T>(error: ResultError): Result<T> {
    return new Result<T>(false, undefined, error);
  }

  /**
   * Combina múltiplos Results; retorna falha no primeiro erro encontrado.
   */
  static combine(results: Result<unknown>[]): Result<any> {
    for (const result of results) {
      if (result.isFailure) {
        return Result.fail<void>(result._error!);
      }
    }
    return Result.ok<void>();
  }

  /**
   * Transforma o valor interno caso seja sucesso, caso contrário propaga a falha.
   */
  map<U>(fn: (value: T) => U): Result<U> {
    if (this.isFailure) {
      return Result.fail<U>(this._error!);
    }
    return Result.ok<U>(fn(this._value as T));
  }

  /**
   * Encadeia outro Result caso seja sucesso, caso contrário propaga a falha.
   */
  flatMap<U>(fn: (value: T) => Result<U>): Result<U> {
    if (this.isFailure) {
      return Result.fail<U>(this._error!);
    }
    return fn(this._value as T);
  }
}
