import { AccountsController } from '@/accounts/infra/controllers/Accounts.controller';
import { AccountsRepository } from '@/accounts/core/provider/accounts.repository';
import { Module } from '@nestjs/common';
import { PrismaAccountsRepository } from '@/accounts/infra/db/PrismaAccounts.repository';
import { PrismaListTransactionsQuery } from '@/accounts/infra/db/PrismaListTransactions.query';
import { PrismaService } from '@/shared/infra/PrismaService';
import { CreateAccountUseCase } from '@/accounts/core/usecases/CreateAccount.usecase';
import { ListAccountsUseCase } from '@/accounts/core/usecases/ListAccounts.usecase';
import { ListTransactionsQuery } from '@/accounts/core/provider/ListTransactions.query';

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
      useFactory: (repo: AccountsRepository, query: ListTransactionsQuery) =>
        new ListAccountsUseCase(repo, query),
      inject: [AccountsRepository, ListTransactionsQuery],
    },
    {
      provide: ListTransactionsQuery,
      useFactory: (prisma: PrismaService) => new PrismaListTransactionsQuery(prisma),
      inject: [PrismaService],
    },
  ],
})
export class AccountsModule {}
