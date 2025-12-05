import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Agent, AgentDocument } from '../agents/schemas/agents.schema';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Agent.name) private agentModel: Model<AgentDocument>,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    pass: string,
    isRawPassword = true,
  ): Promise<any> {
    const user = await this.agentModel.findOne({ email }).select('+password');
    if (!user || !user.password) {
      return null;
    }

    let isMatch = false;
    if (isRawPassword) {
      isMatch = await bcrypt.compare(pass, user.password);
    } else {
      isMatch = pass === user.password;
    }

    if (isMatch) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(
      loginDto.email,
      loginDto.password,
      loginDto.isRawPassword,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return {
      access_token: this.jwtService.sign(user),
    };
  }
}
