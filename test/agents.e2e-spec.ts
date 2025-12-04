import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { AgentService } from './../src/agents/agents.service';

describe('AgentsController (e2e)', () => {
  let app: INestApplication;
  const agentService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AgentService)
      .useValue(agentService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/agents (GET)', () => {
    agentService.findAll.mockResolvedValue([]);
    return request(app.getHttpServer()).get('/agents').expect(200).expect([]);
  });

  it('/agents (POST)', () => {
    const createDto = {
      name: 'Test Agent',
      email: 'test@example.com',
      isActive: true,
    };
    agentService.create.mockResolvedValue({
      _id: '1',
      ...createDto,
    });

    return request(app.getHttpServer())
      .post('/agents')
      .send(createDto)
      .expect(201)
      .expect('Agent Test Agent created!');
  });

  it('/agents/:id (GET)', () => {
    const agent = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test Agent',
      email: 'test@example.com',
    };
    agentService.findById.mockResolvedValue(agent);

    return request(app.getHttpServer())
      .get('/agents/507f1f77bcf86cd799439011')
      .expect(200)
      .expect((res) => {
        expect(res.body.name).toBe('Test Agent');
      });
  });

  it('/agents/:id (PATCH)', () => {
    const updateDto = { name: 'Updated Name' };
    agentService.update.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      name: 'Updated Name',
    });

    return request(app.getHttpServer())
      .patch('/agents/507f1f77bcf86cd799439011')
      .send(updateDto)
      .expect(200);
  });

  it('/agents/:id (DELETE)', () => {
    agentService.delete.mockResolvedValue({});

    return request(app.getHttpServer())
      .delete('/agents/507f1f77bcf86cd799439011')
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });
});
