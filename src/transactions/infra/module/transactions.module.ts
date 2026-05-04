import { Module } from '@nestjs/common';
import { PrismaService } from '@/shared/infra/PrismaService';
import { RegisterExpenseUseCase } from '@/transactions/core/usecases/RegisterExpense.usecase';
import { RegisterIncomeUseCase } from '@/transactions/core/usecases/RegisterIncome.usecase';
import { TransactionAccountQuery } from '../../core/provider/TransactionAccount.query';
import { TransactionsRepository } from '@/transactions/core/provider/Transactions.repository';
import { PrismaTransactionAccountAcl } from '@/transactions/infra/acl/account/PrismaTransactionAccountAcl';
import { PrismaTransactionsRepository } from '@/transactions/infra/db/PrismaTransactions.repository';
import { TransactionsController } from '@/transactions/infra/controllers/Transactions.controller';

@Module({
  imports: [],
  controllers: [TransactionsController],
  providers: [
    PrismaService,
    {
      provide: TransactionsRepository,
      useFactory: (prisma: PrismaService) => new PrismaTransactionsRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: TransactionAccountQuery,
      useFactory: (prisma: PrismaService) => new PrismaTransactionAccountAcl(prisma),
      inject: [PrismaService],
    },
    {
      provide: RegisterExpenseUseCase,
      useFactory: (
        transactionsRepository: TransactionsRepository,
        accounts: TransactionAccountQuery,
      ) => new RegisterExpenseUseCase(transactionsRepository, accounts),
      inject: [TransactionsRepository, TransactionAccountQuery],
    },
    {
      provide: RegisterIncomeUseCase,
      useFactory: (
        transactionsRepository: TransactionsRepository,
        accounts: TransactionAccountQuery,
      ) => new RegisterIncomeUseCase(transactionsRepository, accounts),
      inject: [TransactionsRepository, TransactionAccountQuery],
    },
  ],
})
export class TransactionsModule {}
