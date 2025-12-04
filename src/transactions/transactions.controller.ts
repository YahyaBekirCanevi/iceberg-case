import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { Transaction, FinancialBreakdown } from './schemas/transaction.schema';

@Controller('transactions')
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

  @Get(':id/financials')
  async getFinancials(@Param('id') id: string): Promise<FinancialBreakdown> {
    return this.transactionsService.getFinancials(id);
  }
}
