import { Module } from '@nestjs/common';
import { AccountsModule } from '@/accounts/infra/module/accounts.module';
import { PrismaService } from '@/shared/infra/PrismaService';
import { ConfigModule } from '@nestjs/config';

@Module({ imports: [AccountsModule, ConfigModule.forRoot()], providers: [PrismaService] })
export class EntryPointModule {}
