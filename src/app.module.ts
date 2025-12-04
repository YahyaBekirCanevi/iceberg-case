import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgentsModule } from './agents/agents.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}`),
    AgentsModule,
    TransactionsModule,
  ],
})
export class AppModule {}
