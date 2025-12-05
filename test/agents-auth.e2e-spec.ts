import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { JwtService } from '@nestjs/jwt';

describe('AgentsController (e2e) - Auth', () => {
  let app: INestApplication;
  let connection: Connection;
  let jwtService: JwtService;
  let agentId: string;
  let otherAgentId: string;
  let token: string;
  let otherToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    connection = app.get(getConnectionToken());
    jwtService = app.get(JwtService);

    // Clean up database
    await connection.collection('agents').deleteMany({});

    // Create main agent
    const agentRes = await request(app.getHttpServer()).post('/agents').send({
      name: 'Test Agent',
      email: 'test@example.com',
      password: 'password123',
    });

    // We need to fetch the agent to get the ID because the POST returns a string message
    const agent = await connection
      .collection('agents')
      .findOne({ email: 'test@example.com' });

    if (!agent) {
      throw new Error('Agent not found');
    }

    agentId = agent._id.toString();
    token = jwtService.sign({ sub: agentId, email: agent.email });

    // Create other agent
    await request(app.getHttpServer()).post('/agents').send({
      name: 'Other Agent',
      email: 'other@example.com',
      password: 'password123',
    });

    const otherAgent = await connection
      .collection('agents')
      .findOne({ email: 'other@example.com' });

    if (!otherAgent) {
      throw new Error('Other agent not found');
    }

    otherAgentId = otherAgent._id.toString();
    otherToken = jwtService.sign({
      sub: otherAgentId,
      email: otherAgent.email,
    });
  });

  afterAll(async () => {
    await connection.collection('agents').deleteMany({});
    await app.close();
  });

  describe('PATCH /agents/:id', () => {
    it('should fail without token', () => {
      return request(app.getHttpServer())
        .patch(`/agents/${agentId}`)
        .send({ name: 'Updated Name' })
        .expect(401);
    });

    it('should fail when updating another agent', () => {
      return request(app.getHttpServer())
        .patch(`/agents/${otherAgentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Hacked Name' })
        .expect(403);
    });

    it('should succeed when updating own profile', () => {
      return request(app.getHttpServer())
        .patch(`/agents/${agentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' })
        .expect(200);
    });
  });

  describe('DELETE /agents/:id', () => {
    it('should fail without token', () => {
      return request(app.getHttpServer())
        .delete(`/agents/${agentId}`)
        .expect(401);
    });

    it('should fail when deleting another agent', () => {
      return request(app.getHttpServer())
        .delete(`/agents/${otherAgentId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should succeed when deleting own profile', () => {
      return request(app.getHttpServer())
        .delete(`/agents/${agentId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });
});
