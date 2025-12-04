import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { TransactionsService } from './../src/transactions/transactions.service';
import { TransactionStatus } from './../src/types';

describe('TransactionsController (e2e)', () => {
  let app: INestApplication;
  const transactionsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
    getFinancials: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TransactionsService)
      .useValue(transactionsService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/transactions (GET)', () => {
    transactionsService.findAll.mockResolvedValue([]);
    return request(app.getHttpServer())
      .get('/transactions')
      .expect(200)
      .expect([]);
  });

  it('/transactions (POST)', () => {
    const createDto = {
      propertyAddress: '123 Test St',
      contractPrice: 100000,
      totalServiceFee: 2000,
      listingAgentId: '507f1f77bcf86cd799439011',
      sellingAgentId: '507f1f77bcf86cd799439012',
    };
    transactionsService.create.mockResolvedValue({
      _id: '1',
      ...createDto,
      status: TransactionStatus.AGREEMENT,
    });

    return request(app.getHttpServer())
      .post('/transactions')
      .send(createDto)
      .expect(201)
      .expect((res) => {
        expect(res.body._id).toBe('1');
        expect(res.body.status).toBe(TransactionStatus.AGREEMENT);
      });
  });

  it('/transactions/:id/status (PATCH)', () => {
    const updateDto = { status: TransactionStatus.EARNEST_MONEY };
    transactionsService.updateStatus.mockResolvedValue({
      _id: '1',
      status: TransactionStatus.EARNEST_MONEY,
    });

    return request(app.getHttpServer())
      .patch('/transactions/1/status')
      .send(updateDto)
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe(TransactionStatus.EARNEST_MONEY);
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
