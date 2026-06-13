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
import { CreateAccountUseCase } from '@/accounts/core/usecases/CreateAccount.usecase';
import { ListAccountsUseCase } from '@/accounts/core/usecases/ListAccounts.usecase';
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
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly listAccountsUseCase: ListAccountsUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'All accounts have been successfully listed.',
    type: ListAccountsResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async list(@Query() query: ListAccountsQueryDto = {}): Promise<ListAccountsResponseDto> {
    const result = await this.listAccountsUseCase.execute({
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
    const result = await this.createAccountUseCase.execute({
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
