import { ValidationError } from '@/shared/errors/validation-error';
import { ResultErrors } from '@/shared/errors/shared-errors';
import { ResultValidator } from '@/shared/base/result-validator';

function extractError(error: unknown): string | string[] {
  if (error instanceof ValidationError) {
    return error.messages.map((message) => message.code ?? 'validation-error');
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'UNKNOWN_ERROR';
}

export class Result<T> {
  constructor(
    private readonly _instance?: T | null,
    private _errors?: string[],
  ) {}

  get instance(): T {
    return this._instance!;
  }

  get errors(): string[] {
    const hasNoErrors = !this._errors || this._errors.length === 0;
    if (hasNoErrors && this._instance === undefined) {
      return [ResultErrors.UNDEFINED];
    }
    return this._errors as string[];
  }

  get isOk(): boolean {
    return !this.errors;
  }

  get isFailure(): boolean {
    return !!this.errors;
  }

  get withFail(): Result<any> {
    return Result.fail<any>(this.errors!);
  }

  get validator(): ResultValidator<T, Result<T>> {
    return new ResultValidator<T, Result<T>>(this);
  }

  static ok<T>(instance?: T): Result<T> {
    return new Result<T>(instance ?? null);
  }

  static fail<T>(e: string | string[]): Result<T> {
    const errors = typeof e === 'string' ? [e] : Array.isArray(e) ? e : [e];
    return new Result<T>(undefined, errors);
  }

  static empty<T>(): Result<T> {
    return new Result<T>(null);
  }

  static async tryAsync<T>(fn: () => Promise<Result<T>>): Promise<Result<T>>;

  static async tryAsync<T>(fn: () => Promise<T>): Promise<Result<T>>;

  static async tryAsync(fn: () => Promise<void>): Promise<Result<void>>;

  static async tryAsync<T>(fn: () => Promise<Result<T> | T | void>): Promise<Result<T | void>> {
    try {
      const result = await fn();
      if (result instanceof Result) {
        return result;
      }

      return Result.ok(result);
    } catch (error: unknown) {
      return Result.fail<T | void>(extractError(error));
    }
  }

  static try<T>(fn: () => Result<T>): Result<T>;

  static try<T>(fn: () => T): Result<T>;

  static try<T>(fn: () => Result<T> | T): Result<T> {
    try {
      const result = fn();
      if (result instanceof Result) {
        return result;
      }

      return Result.ok<T>(result);
    } catch (error: unknown) {
      return Result.fail<T>(extractError(error));
    }
  }

  static combine<const R extends readonly Result<any>[]>(
    results: R,
  ): Result<{ [K in keyof R]: R[K] extends Result<infer T> ? T : never }> {
    const errors = results.filter((r) => r.isFailure);
    if (errors.length) {
      return Result.fail(errors.flatMap((r) => r.errors!));
    }

    const instances = results.map((r) => r._instance) as unknown as {
      [K in keyof R]: R[K] extends Result<infer T> ? T : never;
    };

    return Result.ok(instances);
  }

  static each<T>(
    value: unknown,
    tryCreate: (item: any) => Result<T>,
    errorCode: string,
  ): Result<T>[] {
    if (value == null) {
      return [];
    }

    if (!Array.isArray(value)) {
      return [Result.fail<T>(errorCode)];
    }

    return value.map((item) => tryCreate(item));
  }

  static async combineAsync<T>(results: Promise<Result<T>>[]): Promise<Result<T[]>> {
    const rs = await Promise.all(results);
    return Result.combine(rs);
  }

  toString(): string {
    if (this.isOk) {
      return `Result.ok(${JSON.stringify(this._instance)})`;
    } else {
      return `Result.fail(${JSON.stringify(this._errors)})`;
    }
  }
}
