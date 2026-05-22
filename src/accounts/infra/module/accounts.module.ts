import { AccountsController } from '@/accounts/infra/controllers/Accounts.controller';
import { AccountsRepository } from '@/accounts/core/provider/accounts.repository';
import { Module, Provider } from '@nestjs/common';
import { PrismaAccountsRepository } from '@/accounts/infra/db/PrismaAccounts.repository';
import { PrismaService } from '@/shared/infra/PrismaService';
import { CreateAccountUseCase } from '@/accounts/core/usecases/CreateAccount.usecase';
import { UpdateAccountBalance } from '@/accounts/core/usecases/UpdateAccountBalance';
import { TransactionRegisteredHandler } from '@/accounts/infra/controllers/events/UpdateAccountBalance/TransactionRegisteredHandler';
import { TransactionEditedHandler } from '@/accounts/infra/controllers/events/UpdateAccountBalance/TransactionEditedHandler';
import { TransferRegisteredHandler } from '@/accounts/infra/controllers/events/UpdateAccountBalance/TransferRegisteredHandler';
import { ApplyTransferBetweenAccountsUseCase } from '@/accounts/core/usecases/ApplyTransferBetweenAccounts.usecase';
import { ListAccountsUseCase } from '@/accounts/core/usecases/ListAccounts.usecase';

const eventHandlers: Provider[] = [
  TransactionRegisteredHandler,
  TransactionEditedHandler,
  TransferRegisteredHandler,
];

@Module({
  imports: [],
  controllers: [AccountsController],
  providers: [
    PrismaService,
    {
      provide: AccountsRepository,
      useFactory: (prisma: PrismaService) => new PrismaAccountsRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: CreateAccountUseCase,
      useFactory: (repo: AccountsRepository) => new CreateAccountUseCase(repo),
      inject: [AccountsRepository],
    },
    {
      provide: ListAccountsUseCase,
      useFactory: (repo: AccountsRepository) => new ListAccountsUseCase(repo),
      inject: [AccountsRepository],
    },
    {
      provide: UpdateAccountBalance,
      useFactory: (repo: AccountsRepository) => new UpdateAccountBalance(repo),
      inject: [AccountsRepository],
    },
    {
      provide: ApplyTransferBetweenAccountsUseCase,
      useFactory: (accountsRepository: AccountsRepository) =>
        new ApplyTransferBetweenAccountsUseCase(accountsRepository),
      inject: [AccountsRepository],
    },
    ...eventHandlers,
  ],
})
export class AccountsModule {}
