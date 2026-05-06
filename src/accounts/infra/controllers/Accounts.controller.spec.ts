import { BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { CreateAccountUseCase } from '@/accounts/core/usecases/CreateAccount.usecase';
import { Account } from '@/accounts/core/model/Account';
import { CreateAccountDto } from '@/accounts/infra/dtos/CreateAccount.dto';
import { Result } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';
import { AccountsController } from './Accounts.controller';

describe('AccountsController', () => {
  let controller: AccountsController;
  let executeMock: jest.Mock;

  beforeEach(() => {
    executeMock = jest.fn();
    controller = new AccountsController({
      execute: executeMock,
    } as unknown as CreateAccountUseCase);
  });

  describe('create()', () => {
    it('should call CreateAccountUseCase.execute with dto fields and balance zero', async () => {
      const dto: CreateAccountDto = { name: 'Nubank', openingBalance: 150 };
      const account = Account.new({
        name: 'Nubank',
        balance: 0,
        openingBalance: 150,
      });
      executeMock.mockResolvedValue(Result.ok(account));

      await controller.create(dto);

      expect(executeMock).toHaveBeenCalledTimes(1);
      expect(executeMock).toHaveBeenCalledWith({
        name: 'Nubank',
        openingBalance: 150,
        balance: 0,
      });
    });

    it('should return CreateAccountResponseDto mapped from the created account', async () => {
      const dto: CreateAccountDto = { name: 'Wallet', openingBalance: 42.5 };
      const account = Account.new({
        name: 'Wallet',
        balance: 0,
        openingBalance: 42.5,
      });
      executeMock.mockResolvedValue(Result.ok(account));

      const response = await controller.create(dto);

      expect(response.id).toBe(account.id);
      expect(response.name).toBe('Wallet');
      expect(response.openingBalance).toBe(42.5);
    });

    it('should log and throw InternalServerErrorException when persistence fails', async () => {
      const dto: CreateAccountDto = { name: 'X', openingBalance: 0 };
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      executeMock.mockResolvedValue(Result.fail({ code: Errors.PRISMA_INSERT_ERROR }));

      await expect(controller.create(dto)).rejects.toThrow(InternalServerErrorException);

      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      expect(String(loggerErrorSpy.mock.calls[0]?.[0])).toContain('Error during create account');

      loggerErrorSpy.mockRestore();
    });

    it('should throw BadRequestException when domain validation fails', async () => {
      const dto: CreateAccountDto = { name: 'Y', openingBalance: 0 };
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      executeMock.mockResolvedValue(Result.fail({ code: Errors.MONEY_NOT_FINITE }));

      await expect(controller.create(dto)).rejects.toThrow(BadRequestException);

      loggerErrorSpy.mockRestore();
    });
  });
});
