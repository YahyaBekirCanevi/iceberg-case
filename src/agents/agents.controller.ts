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
import { CreateAgentDto } from './dto/CreateAgent.dto';
import mongoose from 'mongoose';
import { UpdateAgentDto } from './dto/UpdateAgent.dto';

@Controller('agents')
export class AgentsController {
  constructor(private service: AgentService) {}

  @Post()
  createAgent(@Body() createAgentDto: CreateAgentDto) {
    const createdAgent = this.service.create(createAgentDto);
    if (!createdAgent) {
      throw new HttpException('Failed to create Agent', 400);
    }
    return `Agent ${createAgentDto.name} created!`;
  }

  @Get()
  getAll() {
    return this.service.findAll();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    const isValid = mongoose.Types.ObjectId.isValid(id);
    if (!isValid) {
      throw new HttpException('Agent not found', 404);
    }
    const findAgent = this.service.findById(id);
    if (!findAgent) {
      throw new HttpException('Agent not found', 404);
    }
    return findAgent;
  }

  @Patch(':id')
  updateById(@Param('id') id: string, @Body() updateAgentDto: UpdateAgentDto) {
    const isValid = mongoose.Types.ObjectId.isValid(id);
    if (!isValid) {
      throw new HttpException('Agent not found', 404);
    }
    return this.service.update(id, updateAgentDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    const isValid = mongoose.Types.ObjectId.isValid(id);
    if (!isValid) {
      throw new HttpException('Agent not found', 404);
    }
    this.service.delete(id);
  }
}
