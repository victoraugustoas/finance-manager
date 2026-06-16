import { AccountsController } from '@/accounts/infra/controllers/Accounts.controller';
import { AccountsRepository } from '@/accounts/core/ports/repositories/Accounts.repository';
import { Module } from '@nestjs/common';
import { PrismaAccountsRepository } from '@/accounts/infra/database/repositories/PrismaAccounts.repository';
import { PrismaService } from '@/shared/infra/PrismaService';
import { CreateAccountHandler } from '@/accounts/core/commands/CreateAccount/CreateAccount.handler';

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
      provide: CreateAccountHandler,
      useFactory: (repo: AccountsRepository) => new CreateAccountHandler(repo),
      inject: [AccountsRepository],
    },
  ],
})
export class AccountsModule {}
