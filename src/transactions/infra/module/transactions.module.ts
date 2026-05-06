import { Module } from '@nestjs/common';
import { PrismaService } from '@/shared/infra/PrismaService';
import { RegisterExpenseUseCase } from '@/transactions/core/usecases/RegisterExpense.usecase';
import { RegisterIncomeUseCase } from '@/transactions/core/usecases/RegisterIncome.usecase';
import { TransactionAccountQuery } from '../../core/provider/TransactionAccount.query';
import { TransactionCategoryHierarchyQuery } from '../../core/provider/TransactionCategoryHierarchy.query';
import { TransactionsRepository } from '@/transactions/core/provider/Transactions.repository';
import { PrismaTransactionAccountAcl } from '@/transactions/infra/acl/account/PrismaTransactionAccountAcl';
import { PrismaTransactionCategoryHierarchyAcl } from '@/transactions/infra/acl/category/PrismaTransactionCategoryHierarchyAcl';
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
      provide: TransactionCategoryHierarchyQuery,
      useFactory: (prisma: PrismaService) => new PrismaTransactionCategoryHierarchyAcl(prisma),
      inject: [PrismaService],
    },
    {
      provide: RegisterExpenseUseCase,
      useFactory: (
        transactionsRepository: TransactionsRepository,
        accounts: TransactionAccountQuery,
        categoryHierarchy: TransactionCategoryHierarchyQuery,
      ) => new RegisterExpenseUseCase(transactionsRepository, accounts, categoryHierarchy),
      inject: [TransactionsRepository, TransactionAccountQuery, TransactionCategoryHierarchyQuery],
    },
    {
      provide: RegisterIncomeUseCase,
      useFactory: (
        transactionsRepository: TransactionsRepository,
        accounts: TransactionAccountQuery,
        categoryHierarchy: TransactionCategoryHierarchyQuery,
      ) => new RegisterIncomeUseCase(transactionsRepository, accounts, categoryHierarchy),
      inject: [TransactionsRepository, TransactionAccountQuery, TransactionCategoryHierarchyQuery],
    },
  ],
})
export class TransactionsModule {}
