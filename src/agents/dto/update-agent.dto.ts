import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateAgentDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  name: string;

  @IsEmail()
  @IsOptional()
  @ApiProperty({ required: false })
  email: string;
}