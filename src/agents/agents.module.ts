import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Agent, AgentSchema } from './schemas/agents.schema';
import { AgentService as AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Agent.name,
        schema: AgentSchema,
      },
    ]),
  ],
  providers: [AgentsService],
  controllers: [AgentsController]
})
export class AgentsModule {}
