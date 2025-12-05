import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
  Transaction,
  TransactionDocument,
  FinancialBreakdown,
  CommissionDistribution,
} from './schemas/transaction.schema';
import {
  TransactionHistory,
  TransactionHistoryDocument,
} from './schemas/transaction-history.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import {
  TransactionStatus,
  AgentRole,
  transactionStages,
} from '../shared/types';
import { Agent, AgentDocument } from '../agents/schemas/agents.schema';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(TransactionHistory.name)
    private historyModel: Model<TransactionHistoryDocument>,
    @InjectModel(Agent.name) private agentModel: Model<AgentDocument>,
    private configService: ConfigService,
  ) {}

  async create(
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    const { listingAgentId, sellingAgentId, ...rest } = createTransactionDto;

    // Validate agents exist
    const listingAgent = await this.agentModel.findById(listingAgentId);
    const sellingAgent = await this.agentModel.findById(sellingAgentId);

    if (!listingAgent || !sellingAgent) {
      throw new NotFoundException('One or both agents not found');
    }

    const createdTransaction = new this.transactionModel({
      ...rest,
      listingAgent: listingAgentId,
      sellingAgent: sellingAgentId,
      status: TransactionStatus.AGREEMENT,
    });
    return createdTransaction.save();
  }

  async findAll(): Promise<Transaction[]> {
    return this.transactionModel
      .find()
      .populate('listingAgent')
      .populate('sellingAgent')
      .exec();
  }

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.transactionModel
      .findById(id)
      .populate('listingAgent')
      .populate('sellingAgent')
      .exec();
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return transaction;
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateTransactionStatusDto,
  ): Promise<Transaction> {
    const transaction = await this.transactionModel.findById(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    const currentStatus = transaction.status;
    const newStatus = updateStatusDto.status;

    this.validateTransition(currentStatus, newStatus);

    transaction.status = newStatus;

    // Create History Record
    await this.historyModel.create({
      transactionId: transaction._id,
      previousStatus: currentStatus,
      newStatus: newStatus,
    });

    if (newStatus === TransactionStatus.COMPLETED) {
      await this.calculateFinancials(transaction);
    }

    return transaction.save();
  }

  async update(
    id: string,
    updateTransactionDto: UpdateTransactionDto,
  ): Promise<Transaction> {
    const transaction = await this.transactionModel.findByIdAndUpdate(
      id,
      updateTransactionDto,
      { new: true },
    );

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  private validateTransition(
    current: TransactionStatus,
    next: TransactionStatus,
  ) {
    const currentIndex = transactionStages.indexOf(current);
    const nextIndex = transactionStages.indexOf(next);

    if (nextIndex <= currentIndex) {
      throw new BadRequestException(
        `Invalid transition from ${current} to ${next}. Can only move forward.`,
      );
    }

    if (nextIndex !== currentIndex + 1) {
      throw new BadRequestException(
        `Invalid transition from ${current} to ${next}. Stages must be sequential.`,
      );
    }
  }

  private async calculateFinancials(transaction: TransactionDocument) {
    const totalFee = transaction.totalServiceFee;
    const agencyShare = totalFee * 0.5;
    const agentPool = totalFee * 0.5;

    const distributions: CommissionDistribution[] = [];

    // Fetch agents to get their names for the snapshot
    const listingAgent = await this.agentModel.findById(
      transaction.listingAgent,
    );
    const sellingAgent = await this.agentModel.findById(
      transaction.sellingAgent,
    );

    if (!listingAgent || !sellingAgent) {
      throw new Error('Agents not found during financial calculation');
    }

    if (listingAgent._id.toString() === sellingAgent._id.toString()) {
      // Scenario 1: Same agent
      distributions.push({
        agentId: listingAgent._id.toString(),
        agentName: listingAgent.name,
        role: AgentRole.BOTH,
        amount: agentPool,
      });
    } else {
      // Scenario 2: Different agents
      const splitAmount = agentPool / 2;
      distributions.push({
        agentId: listingAgent._id.toString(),
        agentName: listingAgent.name,
        role: AgentRole.LISTING,
        amount: splitAmount,
      });
      distributions.push({
        agentId: sellingAgent._id.toString(),
        agentName: sellingAgent.name,
        role: AgentRole.SELLING,
        amount: splitAmount,
      });
    }

    transaction.financialBreakdown = {
      agencyAmount: agencyShare,
      agentPoolAmount: agentPool,
      agentDistributions: distributions,
    };
  }

  async getFinancials(id: string): Promise<FinancialBreakdown> {
    const transaction = await this.findOne(id);
    if (
      transaction.status !== TransactionStatus.COMPLETED ||
      !transaction.financialBreakdown
    ) {
      throw new BadRequestException(
        'Transaction is not completed or financials are missing',
      );
    }
    return transaction.financialBreakdown;
  }

  async getHistory(id: string): Promise<TransactionHistory[]> {
    return this.historyModel
      .find({ transactionId: id })
      .sort({ createdAt: -1 })
      .exec();
  }
}
