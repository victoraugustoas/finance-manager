import { BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { Result } from '@/shared/base/result';
import { RepositoryErrors } from '@/shared/errors/shared-errors';
import { Account, CreateAccount } from '@/modules/account';
import { AccountController } from '../../infra/account/account.controller';

describe('AccountController', () => {
  let controller: AccountController;
  let execute: jest.Mock;

  beforeEach(() => {
    execute = jest.fn();
    controller = new AccountController({ execute } as unknown as CreateAccount);
  });

  test('should call the use case with the dto fields', async () => {
    execute.mockResolvedValue(Result.ok(Account.create({ name: 'Nubank', openingBalance: 15000 })));

    await controller.create({ name: 'Nubank', openingBalance: 150 });

    expect(execute).toHaveBeenCalledWith({ name: 'Nubank', openingBalance: 150 });
  });

  test('should map the created account to the response dto', async () => {
    const account = Account.create({ name: 'Wallet', openingBalance: 4250 });
    execute.mockResolvedValue(Result.ok(account));

    const response = await controller.create({ name: 'Wallet', openingBalance: 42.5 });

    expect(response).toEqual({ id: account.id, name: 'Wallet', openingBalance: 42.5 });
  });

  test('should translate persistence failures into 500', async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    execute.mockResolvedValue(Result.fail(RepositoryErrors.WRITE_FAILED));

    await expect(controller.create({ name: 'X', openingBalance: 0 })).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  test('should translate domain failures into 400', async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    execute.mockResolvedValue(Result.fail('MONEY_NOT_FINITE'));

    await expect(controller.create({ name: 'Y', openingBalance: 0 })).rejects.toThrow(
      BadRequestException,
    );
  });
});
