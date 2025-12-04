import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class CreateAgentDto {
  @IsString()
  @ApiProperty({ required: true })
  name: string;

  @IsEmail()
  @ApiProperty({ required: true })
  email: string;
  
  isActive: boolean = true;
}
