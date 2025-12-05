import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Agent {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ select: false }) // Don't return password by default
  password?: string;
}

export const AgentSchema = SchemaFactory.createForClass(Agent);

export type AgentDocument = Agent & Document;
