import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AgentService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import mongoose from 'mongoose';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Controller('agents')
export class AgentsController {
  constructor(private service: AgentService) {}

  @Post()
  async createAgent(@Body() createAgentDto: CreateAgentDto) {
    const createdAgent = await this.service.create(createAgentDto);
    if (!createdAgent) {
      throw new HttpException('Failed to create Agent', 400);
    }
    return `Agent ${createAgentDto.name} created!`;
  }

  @Get()
  async getAll() {
    return await this.service.findAll();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const isValid = mongoose.Types.ObjectId.isValid(id);
    if (!isValid) {
      throw new HttpException('Agent not found', 404);
    }
    const findAgent = await this.service.findById(id);
    if (!findAgent) {
      throw new HttpException('Agent not found', 404);
    }
    return findAgent;
  }

  @Patch(':id')
  async updateById(@Param('id') id: string, @Body() updateAgentDto: UpdateAgentDto) {
    const isValid = mongoose.Types.ObjectId.isValid(id);
    if (!isValid) {
      throw new HttpException('Agent not found', 404);
    }
    return await this.service.update(id, updateAgentDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const isValid = mongoose.Types.ObjectId.isValid(id);
    if (!isValid) {
      throw new HttpException('Agent not found', 404);
    }
    await this.service.delete(id);
  }
}
