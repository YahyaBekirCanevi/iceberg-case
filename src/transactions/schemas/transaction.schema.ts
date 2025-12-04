import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { AgentRole, TransactionStatus } from '../../types';
import { Agent } from '../../agents/schemas/agents.schema';

@Schema({ _id: false })
export class CommissionDistribution {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Agent' })
  agentId: string;

  @Prop({ required: true })
  agentName: string; // snapshot

  @Prop({ required: true, enum: AgentRole, type: String })
  role: AgentRole;

  @Prop({ required: true })
  amount: number;
}

const CommissionDistributionSchema = SchemaFactory.createForClass(
  CommissionDistribution,
);

@Schema({ _id: false })
export class FinancialBreakdown {
  @Prop({ required: true })
  agencyAmount: number;

  @Prop({ required: true })
  agentPoolAmount: number;

  @Prop({ type: [CommissionDistributionSchema], default: [] })
  agentDistributions: CommissionDistribution[];
}

const FinancialBreakdownSchema =
  SchemaFactory.createForClass(FinancialBreakdown);

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ required: true })
  propertyAddress: string;

  @Prop({ required: true })
  contractPrice: number;

  @Prop({ required: true })
  totalServiceFee: number;

  @Prop({
    required: true,
    enum: TransactionStatus,
    default: TransactionStatus.AGREEMENT,
    type: String,
  })
  status: TransactionStatus;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Agent' })
  listingAgent: Agent;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Agent' })
  sellingAgent: Agent;

  // Snapshot (status = COMPLETED)
  @Prop({ type: FinancialBreakdownSchema })
  financialBreakdown?: FinancialBreakdown;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

export type TransactionDocument = Transaction & Document;
