import { AccountsController } from '@/accounts/infra/controllers/Accounts.controller';
import { AccountsRepository } from '@/accounts/core/provider/accounts.repository';
import { Module } from '@nestjs/common';
import { PrismaAccountsRepository } from '@/accounts/infra/db/PrismaAccounts.repository';
import { PrismaService } from '@/shared/infra/PrismaService';
import { CreateAccountUseCase } from '@/accounts/core/usecases/CreateAccount.usecase';

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
  ],
})
export class AccountsModule {}
