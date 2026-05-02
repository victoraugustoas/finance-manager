import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Post,
} from '@nestjs/common';
import { CreateAccountUseCase } from '@/accounts/core/usecases/CreateAccount.usecase';
import { CreateAccountDto } from '@/accounts/infra/dtos/CreateAccount.dto';

@Controller('accounts')
export class AccountsController {
  private readonly logger = new Logger(AccountsController.name);

  constructor(private readonly createAccountUseCase: CreateAccountUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateAccountDto) {
    const account = await this.createAccountUseCase.execute({
      name: dto.name,
      openingBalance: dto.openingBalance,
      balance: 0,
    });
    if (account.isFailure) {
      const { code, cls, data, message } = account.error;
      this.logger.error(
        `Error during create account: ${JSON.stringify({ code, cls, data, message })}`,
      );
      throw new InternalServerErrorException();
    }
  }
}
