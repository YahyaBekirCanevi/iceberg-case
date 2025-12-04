import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Agent } from './schemas/agents.schema';
import { Model } from 'mongoose';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class AgentService {
  constructor(@InjectModel(Agent.name) private agentModel: Model<Agent>) {}

  async create(createAgentDto: CreateAgentDto): Promise<Agent> {
    const newAgent = new this.agentModel(createAgentDto);
    return newAgent.save();
  }

  async findAll(): Promise<Agent[]> {
    return this.agentModel.find({ isActive: true }).exec();
  }

  async findById(id: string): Promise<Agent> {
    const agent = await this.agentModel.findById(id).exec();
    if (!agent) {
      throw new Error(`Agent with ID ${id} not found`);
    }
    return agent;
  }

  async update(id: string, updateAgentDto: UpdateAgentDto): Promise<Agent> {
    const agent = await this.agentModel.findById(id).exec();
    if (!agent) {
      throw new Error(`Agent with ID ${id} not found`);
    }
    return agent.updateOne(updateAgentDto);
  }

  async delete(id: string): Promise<Agent> {
    const agent = await this.agentModel.findById(id).exec();
    if (!agent) {
      throw new Error(`Agent with ID ${id} not found`);
    }
    return agent.updateOne({ isActive: false });
  }
}
