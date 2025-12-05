import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'test@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: true, required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isRawPassword?: boolean;
}
