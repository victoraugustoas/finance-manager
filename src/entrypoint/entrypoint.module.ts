import { Module } from '@nestjs/common';
import { AccountsModule } from '@/accounts/infra/module/accounts.module';
import { CategoriesModule } from '@/category/infra/module/categories.module';
import { TransactionsModule } from '@/transactions/infra/module/transactions.module';
import { ReportingModule } from '@/reporting/infra/module/reporting.module';
import { PrismaService } from '@/shared/infra/PrismaService';
import { ConfigModule } from '@nestjs/config';
import { EventsModule } from '@/shared/events/EventsModule';

@Module({
  imports: [
    EventsModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    ReportingModule,
    ConfigModule.forRoot(),
  ],
  providers: [PrismaService],
})
export class EntryPointModule {}
