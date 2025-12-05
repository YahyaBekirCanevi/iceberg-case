import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsBoolean,
  IsOptional,
  MinLength,
} from 'class-validator';

export class CreateAgentDto {
  @IsString()
  @ApiProperty({ required: true })
  name: string;

  @IsEmail()
  @ApiProperty({ required: true })
  email: string;

  @IsString()
  @MinLength(6)
  @ApiProperty({ required: true })
  password: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false, default: true })
  isActive: boolean = true;
}
