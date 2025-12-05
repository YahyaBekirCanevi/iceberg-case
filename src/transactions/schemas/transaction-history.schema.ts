import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { TransactionStatus } from '../../shared/types';

@Schema({ timestamps: true })
export class TransactionHistory {
  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: 'Transaction',
  })
  transactionId: string;

  @Prop({ required: true, enum: TransactionStatus, type: String })
  previousStatus: TransactionStatus;

  @Prop({ required: true, enum: TransactionStatus, type: String })
  newStatus: TransactionStatus;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const TransactionHistorySchema =
  SchemaFactory.createForClass(TransactionHistory);

export type TransactionHistoryDocument = TransactionHistory & Document;
