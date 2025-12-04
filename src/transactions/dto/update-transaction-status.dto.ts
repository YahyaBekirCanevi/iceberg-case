import { IsEnum, IsNotEmpty } from 'class-validator';
import { TransactionStatus } from '../../types';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTransactionStatusDto {
  @IsEnum(TransactionStatus)
  @IsNotEmpty()
  @ApiProperty({ required: true })
  status: TransactionStatus;
}
