import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transaction, FinancialBreakdown } from './schemas/transaction.schema';
import { TransactionHistory } from './schemas/transaction-history.schema';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('transactions')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  async create(
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    return this.transactionsService.create(createTransactionDto);
  }

  @Get()
  async findAll(): Promise<Transaction[]> {
    return this.transactionsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Transaction> {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateTransactionStatusDto: UpdateTransactionStatusDto,
  ): Promise<Transaction> {
    return this.transactionsService.updateStatus(
      id,
      updateTransactionStatusDto,
    );
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ): Promise<Transaction> {
    return this.transactionsService.update(id, updateTransactionDto);
  }

  @Get(':id/financials')
  async getFinancials(@Param('id') id: string): Promise<FinancialBreakdown> {
    return this.transactionsService.getFinancials(id);
  }

  @Get(':id/history')
  async getHistory(@Param('id') id: string): Promise<TransactionHistory[]> {
    return this.transactionsService.getHistory(id);
  }
}
