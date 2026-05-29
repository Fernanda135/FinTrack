import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Accounts (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    const reg = await request(app.getHttpServer())
      .post('/api/auth/register').send({ email: `acc${Date.now()}@t.com`, name: 'Acc', password: 'supersecret' });
    token = reg.body.accessToken;
  });
  afterAll(async () => app.close());

  const auth = () => ({ Authorization: `Bearer ${token}` });

  it('creates, lists, updates and deletes an account', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/accounts').set(auth())
      .send({ label: 'Nubank', type: 'CONTA_CORRENTE', balance: 100.5, color: '#8A05BE' })
      .expect(201);
    const id = created.body.id;
    expect(created.body.balance).toBe(100.5);

    const list = await request(app.getHttpServer()).get('/api/accounts').set(auth()).expect(200);
    expect(list.body).toHaveLength(1);

    await request(app.getHttpServer())
      .patch(`/api/accounts/${id}`).set(auth()).send({ label: 'Nu' }).expect(200);

    await request(app.getHttpServer()).delete(`/api/accounts/${id}`).set(auth()).expect(200);
    const after = await request(app.getHttpServer()).get('/api/accounts').set(auth()).expect(200);
    expect(after.body).toHaveLength(0);
  });
});
