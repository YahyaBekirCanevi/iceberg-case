import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { TransactionsService } from './transactions.service';
import { Transaction } from './schemas/transaction.schema';
import { TransactionHistory } from './schemas/transaction-history.schema';
import { Agent } from '../agents/schemas/agents.schema';
import { TransactionStatus, AgentRole } from '../shared/types';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const mockTransaction = {
  _id: 'trans1',
  propertyAddress: '123 Main St',
  contractPrice: 500000,
  totalServiceFee: 10000,
  status: TransactionStatus.AGREEMENT,
  listingAgent: 'agent1',
  sellingAgent: 'agent2',
  save: jest.fn(),
};

const mockAgent1 = {
  _id: 'agent1',
  name: 'Alice',
  email: 'alice@example.com',
};

const mockAgent2 = {
  _id: 'agent2',
  name: 'Bob',
  email: 'bob@example.com',
};

class MockTransactionModel {
  constructor(public data: any) {
    Object.assign(this, data);
  }
  save = jest.fn().mockImplementation(() => Promise.resolve(this));
  static find = jest.fn();
  static findById = jest.fn();
}

class MockAgentModel {
  constructor(public data: any) {
    Object.assign(this, data);
  }
  save = jest.fn().mockImplementation(() => Promise.resolve(this));
  static find = jest.fn();
  static findById = jest.fn();
}

class MockTransactionHistoryModel {
  constructor(public data: any) {
    Object.assign(this, data);
  }
  save = jest.fn().mockImplementation(() => Promise.resolve(this));
  static create = jest.fn();
  static find = jest.fn();
}

const mockConfigService = {
  get: jest.fn(),
};

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionModel: any;
  let agentModel: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getModelToken(Transaction.name),
          useValue: MockTransactionModel,
        },
        {
          provide: getModelToken(Agent.name),
          useValue: MockAgentModel,
        },
        {
          provide: getModelToken(TransactionHistory.name),
          useValue: MockTransactionHistoryModel,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    transactionModel = module.get(getModelToken(Transaction.name));
    agentModel = module.get(getModelToken(Agent.name));

    // Reset mocks
    transactionModel.findById.mockReset();
    agentModel.findById.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a transaction', async () => {
      agentModel.findById
        .mockResolvedValueOnce(mockAgent1)
        .mockResolvedValueOnce(mockAgent2);

      const createDto = {
        propertyAddress: '123 Main St',
        contractPrice: 500000,
        totalServiceFee: 10000,
        listingAgentId: 'agent1',
        sellingAgentId: 'agent2',
      };

      const result = await service.create(createDto);
      expect(result).toBeDefined();
      expect(agentModel.findById).toHaveBeenCalledTimes(2);
    });

    it('should throw if agent not found', async () => {
      agentModel.findById.mockResolvedValueOnce(null);

      const createDto = {
        propertyAddress: '123 Main St',
        contractPrice: 500000,
        totalServiceFee: 10000,
        listingAgentId: 'agent1',
        sellingAgentId: 'agent2',
      };

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update status to EARNEST_MONEY', async () => {
      const trans = new MockTransactionModel({ ...mockTransaction });
      trans.save.mockResolvedValue(trans);
      transactionModel.findById.mockResolvedValue(trans);

      const result = await service.updateStatus('trans1', {
        status: TransactionStatus.EARNEST_MONEY,
      });
      expect(result.status).toBe(TransactionStatus.EARNEST_MONEY);
    });

    it('should throw on invalid transition (skipping stage)', async () => {
      const trans = new MockTransactionModel({ ...mockTransaction });
      trans.save.mockResolvedValue(trans);
      transactionModel.findById.mockResolvedValue(trans);
      await expect(
        service.updateStatus('trans1', {
          status: TransactionStatus.TITLE_DEED,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should calculate financials on COMPLETED', async () => {
      const trans = new MockTransactionModel({
        ...mockTransaction,
        status: TransactionStatus.TITLE_DEED,
      });
      trans.save.mockResolvedValue(trans);
      transactionModel.findById.mockResolvedValue(trans);
      agentModel.findById
        .mockResolvedValueOnce(mockAgent1)
        .mockResolvedValueOnce(mockAgent2);

      const result = await service.updateStatus('trans1', {
        status: TransactionStatus.COMPLETED,
      });

      expect(result.status).toBe(TransactionStatus.COMPLETED);
      expect(result.financialBreakdown).toBeDefined();
      expect(result.financialBreakdown!.agencyAmount).toBe(5000); // 50% of 10000
      expect(result.financialBreakdown!.agentPoolAmount).toBe(5000);
      expect(result.financialBreakdown!.agentDistributions).toHaveLength(2);
      expect(result.financialBreakdown!.agentDistributions[0].amount).toBe(
        2500,
      );
    });

    it('should calculate financials for same agent scenario', async () => {
      const trans = new MockTransactionModel({
        ...mockTransaction,
        status: TransactionStatus.TITLE_DEED,
        listingAgent: 'agent1',
        sellingAgent: 'agent1',
      });
      trans.save.mockResolvedValue(trans);
      transactionModel.findById.mockResolvedValue(trans);
      agentModel.findById.mockResolvedValue(mockAgent1); // Both calls return agent1

      const result = await service.updateStatus('trans1', {
        status: TransactionStatus.COMPLETED,
      });

      expect(result.financialBreakdown!.agentDistributions).toHaveLength(1);
      expect(result.financialBreakdown!.agentDistributions[0].amount).toBe(
        5000,
      );
      expect(result.financialBreakdown!.agentDistributions[0].role).toBe(
        AgentRole.BOTH,
      );
    });
  });
});
