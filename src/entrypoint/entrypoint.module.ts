import { Module } from '@nestjs/common';
import { AccountsModule } from '@/accounts/infra/module/accounts.module';
import { CategoriesModule } from '@/category/infra/module/categories.module';
import { PrismaService } from '@/shared/infra/PrismaService';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [AccountsModule, CategoriesModule, ConfigModule.forRoot()],
  providers: [PrismaService],
})
export class EntryPointModule {}
