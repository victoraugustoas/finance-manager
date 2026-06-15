import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateAccountHandler } from '@/accounts/core/commands/CreateAccount/CreateAccount.handler';
import { ListAccountsHandler } from '@/accounts/core/queries/ListAccounts/ListAccounts.handler';
import { CreateAccountDto } from '@/accounts/infra/dtos/CreateAccount.dto';
import { CreateAccountResponseDto } from '@/accounts/infra/dtos/CreateAccountResponse.dto';
import { ListAccountsQueryDto } from '@/accounts/infra/dtos/ListAccountsQuery.dto';
import { ListAccountsResponseDto } from '@/accounts/infra/dtos/ListAccountsResponse.dto';
import { MapResultErrorToHttpException } from '@/shared/infra/MapResultErrorToHttpException';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';

@Controller('accounts')
export class AccountsController {
  private readonly logger = new Logger(AccountsController.name);

  constructor(
    private readonly createAccountCommandHandler: CreateAccountHandler,
    private readonly listAccountsQueryHandler: ListAccountsHandler,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'All accounts have been successfully listed.',
    type: ListAccountsResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async list(@Query() query: ListAccountsQueryDto = {}): Promise<ListAccountsResponseDto> {
    const result = await this.listAccountsQueryHandler.handle({
      endDate: query.endDate !== undefined ? new Date(query.endDate) : undefined,
    });
    if (result.isFailure) {
      this.logger.error(`Error during list accounts: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }
    return ListAccountsResponseDto.fromDomain(result.value);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'The account has been successfully created.',
    type: CreateAccountResponseDto,
  })
  async create(@Body() dto: CreateAccountDto): Promise<CreateAccountResponseDto> {
    const result = await this.createAccountCommandHandler.handle({
      name: dto.name,
      openingBalance: dto.openingBalance,
    });
    if (result.isFailure) {
      this.logger.error(`Error during create account: ${JSON.stringify(result.errors)}`);
      MapResultErrorToHttpException.throwException(result);
    }
    return CreateAccountResponseDto.fromDomain(result.value);
  }
}
