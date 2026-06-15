import { BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { CreateAccountHandler } from '@/accounts/core/commands/CreateAccount/CreateAccount.handler';
import { ListAccountsHandler } from '@/accounts/core/queries/ListAccounts/ListAccounts.handler';
import { Account } from '@/accounts/core/model/Account';
import { CreateAccountDto } from '@/accounts/infra/dtos/CreateAccount.dto';
import { Result } from '@/shared/base';
import { Errors } from '@/shared/base/Errors';
import { AccountsController } from './Accounts.controller';
import { Money } from '@/shared/ValueObjects';

describe('AccountsController', () => {
  let controller: AccountsController;
  let createHandleMock: jest.Mock;
  let listHandleMock: jest.Mock;

  beforeEach(() => {
    createHandleMock = jest.fn();
    listHandleMock = jest.fn();
    controller = new AccountsController(
      {
        handle: createHandleMock,
      } as unknown as CreateAccountHandler,
      {
        handle: listHandleMock,
      } as unknown as ListAccountsHandler,
    );
  });

  describe('list()', () => {
    it('should call ListAccountsHandler.execute without endDate when query is empty', async () => {
      listHandleMock.mockResolvedValue(Result.ok([]));

      await controller.list();

      expect(listHandleMock).toHaveBeenCalledTimes(1);
      expect(listHandleMock).toHaveBeenCalledWith({ endDate: undefined });
    });

    it('should call ListAccountsHandler.execute with parsed endDate', async () => {
      listHandleMock.mockResolvedValue(Result.ok([]));

      await controller.list({ endDate: '2026-01-31T23:59:59.999Z' });

      expect(listHandleMock).toHaveBeenCalledTimes(1);
      expect(listHandleMock).toHaveBeenCalledWith({
        endDate: new Date('2026-01-31T23:59:59.999Z'),
      });
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
      listHandleMock.mockResolvedValue(
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
      listHandleMock.mockResolvedValue(Result.fail({ code: Errors.PRISMA_QUERY_ERROR }));

      await expect(controller.list()).rejects.toThrow(InternalServerErrorException);

      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      expect(String(loggerErrorSpy.mock.calls[0]?.[0])).toContain('Error during list accounts');

      loggerErrorSpy.mockRestore();
    });
  });

  describe('create()', () => {
    it('should call CreateAccountHandler.execute with dto fields', async () => {
      const dto: CreateAccountDto = { name: 'Nubank', openingBalance: 150 };
      const account = Account.new({
        name: 'Nubank',
        openingBalance: 150,
      });
      createHandleMock.mockResolvedValue(Result.ok(account));

      await controller.create(dto);

      expect(createHandleMock).toHaveBeenCalledTimes(1);
      expect(createHandleMock).toHaveBeenCalledWith({
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
      createHandleMock.mockResolvedValue(Result.ok(account));

      const response = await controller.create(dto);

      expect(response.id).toBe(account.id);
      expect(response.name).toBe('Wallet');
      expect(response.openingBalance).toBe(42.5);
    });

    it('should log and throw InternalServerErrorException when persistence fails', async () => {
      const dto: CreateAccountDto = { name: 'X', openingBalance: 0 };
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      createHandleMock.mockResolvedValue(Result.fail({ code: Errors.PRISMA_INSERT_ERROR }));

      await expect(controller.create(dto)).rejects.toThrow(InternalServerErrorException);

      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      expect(String(loggerErrorSpy.mock.calls[0]?.[0])).toContain('Error during create account');

      loggerErrorSpy.mockRestore();
    });

    it('should throw BadRequestException when domain validation fails', async () => {
      const dto: CreateAccountDto = { name: 'Y', openingBalance: 0 };
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      createHandleMock.mockResolvedValue(Result.fail({ code: Errors.MONEY_NOT_FINITE }));

      await expect(controller.create(dto)).rejects.toThrow(BadRequestException);

      loggerErrorSpy.mockRestore();
    });
  });
});
