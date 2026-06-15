import { AccountsController } from '@/accounts/infra/controllers/Accounts.controller';
import { AccountsRepository } from '@/accounts/core/ports/repositories/Accounts.repository';
import { Module } from '@nestjs/common';
import { PrismaAccountsRepository } from '@/accounts/infra/database/repositories/PrismaAccounts.repository';
import { PrismaListTransactionsReader } from '@/accounts/infra/database/readers/PrismaListTransactionsReader';
import { PrismaService } from '@/shared/infra/PrismaService';
import { CreateAccountHandler } from '@/accounts/core/commands/CreateAccount/CreateAccount.handler';
import { ListAccountsHandler } from '@/accounts/core/queries/ListAccounts/ListAccounts.handler';
import { ListTransactionsReader } from '@/accounts/core/ports/readers/ListTransactionsReader';

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
    {
      provide: ListAccountsHandler,
      useFactory: (repo: AccountsRepository, query: ListTransactionsReader) =>
        new ListAccountsHandler(repo, query),
      inject: [AccountsRepository, ListTransactionsReader],
    },
    {
      provide: ListTransactionsReader,
      useFactory: (prisma: PrismaService) => new PrismaListTransactionsReader(prisma),
      inject: [PrismaService],
    },
  ],
})
export class AccountsModule {}
