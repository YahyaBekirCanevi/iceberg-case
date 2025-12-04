import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Agent } from './schemas/agents.schema';
import { Model } from 'mongoose';
import { CreateAgentDto } from './dto/CreateAgent.dto';
import { UpdateAgentDto } from './dto/UpdateAgent.dto';

@Injectable()
export class AgentService {
  constructor(@InjectModel(Agent.name) private agentModel: Model<Agent>) {}

  create(createAgentDto: CreateAgentDto) {
    const newAgent = new this.agentModel(createAgentDto);
    return newAgent.save();
  }

  findAll() {
    return this.agentModel.find({ isActive: true });
  }

  findById(id: string) {
    return this.agentModel.findById(id);
  }

  update(id: string, updateAgentDto: UpdateAgentDto) {
    return this.agentModel.findByIdAndUpdate(id, updateAgentDto, { new: true });
  }

  delete(id: string) {
    //return this.agentModel.findByIdAndDelete(id);
    return this.agentModel.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }
}
