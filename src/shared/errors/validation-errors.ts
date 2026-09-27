import { ValidationError } from './validation-error';

export class ValidationErrors extends Error {
  public readonly errors: ValidationError[];

  constructor(errors: ValidationError[], options?: ErrorOptions) {
    super(`${errors.length} validation error(s)`, options);
    this.name = 'ValidationErrors';
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      errors: this.errors.map((e) => e.codes),
    };
  }
}
