import { Module } from '@nestjs/common';
import { PrismaService } from '@/shared/infra/prisma.service';
import {
  EditTransaction,
  RegisterExpense,
  RegisterIncome,
  RegisterTransfer,
} from '@/modules/transaction';
import { TransactionController } from './transaction/transaction.controller';
import { PrismaAccountReferenceQuery } from './transaction/provider/prisma-account-reference.query';
import { PrismaCategoryHierarchyQuery } from './transaction/provider/prisma-category-hierarchy.query';
import { PrismaListExpensesQuery } from './transaction/provider/prisma-list-expenses.query';
import { PrismaListIncomesQuery } from './transaction/provider/prisma-list-incomes.query';
import { PrismaListTransfersQuery } from './transaction/provider/prisma-list-transfers.query';
import { PrismaTransactionRepository } from './transaction/provider/prisma-transaction.repository';
import { PrismaTransferRepository } from './transaction/provider/prisma-transfer.repository';

const providersFromPrisma = [
  PrismaTransactionRepository,
  PrismaTransferRepository,
  PrismaAccountReferenceQuery,
  PrismaCategoryHierarchyQuery,
  PrismaListExpensesQuery,
  PrismaListIncomesQuery,
  PrismaListTransfersQuery,
].map((Adapter) => ({
  provide: Adapter,
  useFactory: (prisma: PrismaService) => new Adapter(prisma),
  inject: [PrismaService],
}));

@Module({
  controllers: [TransactionController],
  providers: [
    PrismaService,
    ...providersFromPrisma,
    {
      provide: RegisterExpense,
      useFactory: (
        repository: PrismaTransactionRepository,
        accountReference: PrismaAccountReferenceQuery,
        categoryHierarchy: PrismaCategoryHierarchyQuery,
      ) => new RegisterExpense(repository, accountReference, categoryHierarchy),
      inject: [
        PrismaTransactionRepository,
        PrismaAccountReferenceQuery,
        PrismaCategoryHierarchyQuery,
      ],
    },
    {
      provide: RegisterIncome,
      useFactory: (
        repository: PrismaTransactionRepository,
        accountReference: PrismaAccountReferenceQuery,
        categoryHierarchy: PrismaCategoryHierarchyQuery,
      ) => new RegisterIncome(repository, accountReference, categoryHierarchy),
      inject: [
        PrismaTransactionRepository,
        PrismaAccountReferenceQuery,
        PrismaCategoryHierarchyQuery,
      ],
    },
    {
      provide: RegisterTransfer,
      useFactory: (
        repository: PrismaTransferRepository,
        accountReference: PrismaAccountReferenceQuery,
      ) => new RegisterTransfer(repository, accountReference),
      inject: [PrismaTransferRepository, PrismaAccountReferenceQuery],
    },
    {
      provide: EditTransaction,
      useFactory: (
        repository: PrismaTransactionRepository,
        accountReference: PrismaAccountReferenceQuery,
        categoryHierarchy: PrismaCategoryHierarchyQuery,
      ) => new EditTransaction(repository, accountReference, categoryHierarchy),
      inject: [
        PrismaTransactionRepository,
        PrismaAccountReferenceQuery,
        PrismaCategoryHierarchyQuery,
      ],
    },
  ],
})
export class TransactionModule {}
