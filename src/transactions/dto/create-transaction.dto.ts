import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ required: true })
  propertyAddress: string;

  @IsNumber()
  @Min(0)
  @ApiProperty({ required: true })
  contractPrice: number;

  @IsNumber()
  @Min(0)
  @ApiProperty({ required: true })
  totalServiceFee: number;

  @IsMongoId()
  @ApiProperty({ required: true })
  listingAgentId: string;

  @IsMongoId()
  @ApiProperty({ required: true })
  sellingAgentId: string;
}
