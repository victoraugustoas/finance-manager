import { BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { CreateAccountUseCase } from '@/accounts/core/usecases/CreateAccount.usecase';
import { ListAccountsUseCase } from '@/accounts/core/usecases/ListAccounts.usecase';
import { Account } from '@/accounts/core/model/Account';
import { CreateAccountDto } from '@/accounts/infra/dtos/CreateAccount.dto';
import { Result } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';
import { AccountsController } from './Accounts.controller';
import { Money } from '@/shared/ValueObjects';

describe('AccountsController', () => {
  let controller: AccountsController;
  let createExecuteMock: jest.Mock;
  let listExecuteMock: jest.Mock;

  beforeEach(() => {
    createExecuteMock = jest.fn();
    listExecuteMock = jest.fn();
    controller = new AccountsController(
      {
        execute: createExecuteMock,
      } as unknown as CreateAccountUseCase,
      {
        execute: listExecuteMock,
      } as unknown as ListAccountsUseCase,
    );
  });

  describe('list()', () => {
    it('should call ListAccountsUseCase.execute without params', async () => {
      listExecuteMock.mockResolvedValue(Result.ok([]));

      await controller.list();

      expect(listExecuteMock).toHaveBeenCalledTimes(1);
      expect(listExecuteMock).toHaveBeenCalledWith();
    });

    it('should return ListAccountsResponseDto mapped from listed accounts', async () => {
      const checking = Account.new({
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Checking',
        openingBalance: 25,
      });
      const savings = Account.new({
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Savings',
        openingBalance: 150,
      });
      listExecuteMock.mockResolvedValue(
        Result.ok([
          { account: checking, balance: Money.create(95).value },
          { account: savings, balance: Money.create(175).value },
        ]),
      );

      const response = await controller.list();

      expect(response.accounts).toEqual([
        {
          id: checking.id,
          name: 'Checking',
          openingBalance: 25,
          balance: 95,
        },
        {
          id: savings.id,
          name: 'Savings',
          openingBalance: 150,
          balance: 175,
        },
      ]);
    });

    it('should log and throw InternalServerErrorException when list fails', async () => {
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      listExecuteMock.mockResolvedValue(Result.fail({ code: Errors.PRISMA_QUERY_ERROR }));

      await expect(controller.list()).rejects.toThrow(InternalServerErrorException);

      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      expect(String(loggerErrorSpy.mock.calls[0]?.[0])).toContain('Error during list accounts');

      loggerErrorSpy.mockRestore();
    });
  });

  describe('create()', () => {
    it('should call CreateAccountUseCase.execute with dto fields', async () => {
      const dto: CreateAccountDto = { name: 'Nubank', openingBalance: 150 };
      const account = Account.new({
        name: 'Nubank',
        openingBalance: 150,
      });
      createExecuteMock.mockResolvedValue(Result.ok(account));

      await controller.create(dto);

      expect(createExecuteMock).toHaveBeenCalledTimes(1);
      expect(createExecuteMock).toHaveBeenCalledWith({
        name: 'Nubank',
        openingBalance: 150,
      });
    });

    it('should return CreateAccountResponseDto mapped from the created account', async () => {
      const dto: CreateAccountDto = { name: 'Wallet', openingBalance: 42.5 };
      const account = Account.new({
        name: 'Wallet',
        openingBalance: 42.5,
      });
      createExecuteMock.mockResolvedValue(Result.ok(account));

      const response = await controller.create(dto);

      expect(response.id).toBe(account.id);
      expect(response.name).toBe('Wallet');
      expect(response.openingBalance).toBe(42.5);
    });

    it('should log and throw InternalServerErrorException when persistence fails', async () => {
      const dto: CreateAccountDto = { name: 'X', openingBalance: 0 };
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      createExecuteMock.mockResolvedValue(Result.fail({ code: Errors.PRISMA_INSERT_ERROR }));

      await expect(controller.create(dto)).rejects.toThrow(InternalServerErrorException);

      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      expect(String(loggerErrorSpy.mock.calls[0]?.[0])).toContain('Error during create account');

      loggerErrorSpy.mockRestore();
    });

    it('should throw BadRequestException when domain validation fails', async () => {
      const dto: CreateAccountDto = { name: 'Y', openingBalance: 0 };
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      createExecuteMock.mockResolvedValue(Result.fail({ code: Errors.MONEY_NOT_FINITE }));

      await expect(controller.create(dto)).rejects.toThrow(BadRequestException);

      loggerErrorSpy.mockRestore();
    });
  });
});
