import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgentsModule } from './agents/agents.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validate } from './config/env.validation';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
      isGlobal: true, // Make ConfigModule global so we don't need to import it everywhere
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: `mongodb+srv://${configService.get<string>('DB_USER')}:${configService.get<string>('DB_PASS')}@${configService.get<string>('DB_HOST')}`,
      }),
      inject: [ConfigService],
    }),
    AgentsModule,
    TransactionsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
