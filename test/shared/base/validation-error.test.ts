import { ValidationError } from '@/shared/errors/validation-error';
import { Message } from '@/shared/base/message';

test('should create ValidationError with a single failure', () => {
  const msg: Message = {
    code: 'email.invalid',
    meta: { module: 'auth', object: 'user', attribute: 'email' },
  };

  const error = new ValidationError(msg, 422);

  expect(error.codes).toBe('email.invalid');
  expect(error.message).toBe('email.invalid');
  expect(error.status).toBe(422);
  expect(error.messages).toHaveLength(1);
  expect(error.messages[0]).toBe(msg);
});

test("should use 'validation-error' as default code when code is not provided", () => {
  const error = new ValidationError({
    meta: { module: 'auth', object: 'user', attribute: 'email' },
  });

  expect(error.codes).toBe('validation-error');
  expect(error.message).toBe('validation-error');
  expect(error.status).toBe(400);
  expect(error.messages[0]?.meta?.module).toBe('auth');
});

test('should create ValidationError with multiple failures', () => {
  const error = new ValidationError(
    [
      {
        code: 'email.invalid',
        meta: { module: 'auth', object: 'user', attribute: 'email' },
      },
      {
        code: 'password.invalid',
        meta: { module: 'auth', object: 'user', attribute: 'password' },
      },
    ],
    400,
  );

  expect(error.codes).toBe('email.invalid,password.invalid');
  expect(error.message).toBe('email.invalid,password.invalid');
  expect(error.status).toBe(400);
  expect(error.messages).toHaveLength(2);
  expect(error.messages[0]?.meta?.attribute).toBe('email');
  expect(error.messages[1]?.meta?.attribute).toBe('password');
});
