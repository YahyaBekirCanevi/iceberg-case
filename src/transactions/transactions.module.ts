import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { Agent, AgentSchema } from '../agents/schemas/agents.schema';
import { TransactionHistory, TransactionHistorySchema } from './schemas/transaction-history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: Agent.name, schema: AgentSchema },
      { name: TransactionHistory.name, schema: TransactionHistorySchema },
    ]),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
