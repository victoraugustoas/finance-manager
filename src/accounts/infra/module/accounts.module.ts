import { AccountsController } from '@/accounts/infra/controllers/Accounts.controller';
import { AccountsRepository } from '@/accounts/core/provider/accounts.repository';
import { Module, Provider } from '@nestjs/common';
import { PrismaAccountsRepository } from '@/accounts/infra/db/PrismaAccounts.repository';
import { PrismaService } from '@/shared/infra/PrismaService';
import { CreateAccountUseCase } from '@/accounts/core/usecases/CreateAccount.usecase';
import { UpdateAccountBalance } from '@/accounts/core/usecases/UpdateAccountBalance';
import { TransactionRegisteredHandler } from '@/accounts/infra/controllers/events/UpdateAccountBalance/TransactionRegisteredHandler';

const eventHandlers: Provider[] = [TransactionRegisteredHandler];

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
      provide: UpdateAccountBalance,
      useFactory: (repo: AccountsRepository) => new UpdateAccountBalance(repo),
      inject: [AccountsRepository],
    },
    ...eventHandlers,
  ],
})
export class AccountsModule {}
