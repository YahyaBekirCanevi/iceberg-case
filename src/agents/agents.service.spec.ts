import { Test, TestingModule } from '@nestjs/testing';
import { AgentService } from './agents.service';
import { getModelToken } from '@nestjs/mongoose';
import { Agent } from './schemas/agents.schema';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

describe('AgentService', () => {
  let service: AgentService;
  let model: any;

  const mockAgent = {
    _id: 'someId',
    name: 'Test Agent',
    email: 'test@example.com',
    isActive: true,
    save: jest.fn(),
    updateOne: jest.fn(),
  };

  class MockAgentModel {
    save: any;
    constructor(private data: any) {
      Object.assign(this, data);
      this.save = jest.fn().mockResolvedValue(data);
    }
    static find = jest.fn();
    static findById = jest.fn();
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentService,
        {
          provide: getModelToken(Agent.name),
          useValue: MockAgentModel,
        },
      ],
    }).compile();

    service = module.get<AgentService>(AgentService);
    model = module.get(getModelToken(Agent.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a new agent', async () => {
      const createAgentDto: CreateAgentDto = {
        name: 'Test Agent',
        email: 'test@example.com',
        isActive: true,
      };

      const result = await service.create(createAgentDto);
      expect(result).toEqual(expect.objectContaining(createAgentDto));
    });
  });

  describe('findAll', () => {
    it('should return an array of active agents', async () => {
      const agents = [mockAgent];
      model.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(agents),
      });

      const result = await service.findAll();
      expect(result).toEqual(agents);
      expect(model.find).toHaveBeenCalledWith({ isActive: true });
    });
  });

  describe('findById', () => {
    it('should return an agent if found', async () => {
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAgent),
      });

      const result = await service.findById('someId');
      expect(result).toEqual(mockAgent);
    });

    it('should throw an error if agent not found', async () => {
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findById('someId')).rejects.toThrow(
        'Agent with ID someId not found',
      );
    });
  });

  describe('update', () => {
    it('should update and return the agent', async () => {
      const updateAgentDto: UpdateAgentDto = { name: 'Updated Name' };
      const agentInstance = {
        ...mockAgent,
        updateOne: jest.fn().mockResolvedValue(true),
      };

      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(agentInstance),
      });

      await service.update('someId', updateAgentDto);
      expect(agentInstance.updateOne).toHaveBeenCalledWith(updateAgentDto);
    });

    it('should throw error if agent to update not found', async () => {
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.update('someId', {})).rejects.toThrow(
        'Agent with ID someId not found',
      );
    });
  });

  describe('delete', () => {
    it('should soft delete the agent (set isActive: false)', async () => {
      const agentInstance = {
        ...mockAgent,
        updateOne: jest.fn().mockResolvedValue(true),
      };

      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(agentInstance),
      });

      await service.delete('someId');
      expect(agentInstance.updateOne).toHaveBeenCalledWith({ isActive: false });
    });

    it('should throw error if agent to delete not found', async () => {
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.delete('someId')).rejects.toThrow(
        'Agent with ID someId not found',
      );
    });
  });
});
