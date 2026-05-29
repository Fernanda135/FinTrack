import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Budgets (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let accountId: string;
  let categoryId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    const reg = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: `bud${Date.now()}@t.com`, name: 'Bud', password: 'supersecret' });
    token = reg.body.accessToken;
    const acc = await request(app.getHttpServer())
      .post('/api/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ label: 'C', type: 'CARTEIRA', balance: 5000 });
    accountId = acc.body.id;
    const cat = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ label: 'Lazer', value: 'lazer' });
    categoryId = cat.body.id;
  });
  afterAll(async () => app.close());
  const auth = () => ({ Authorization: `Bearer ${token}` });

  it('requires auth', async () => {
    await request(app.getHttpServer()).get('/api/budgets').expect(401);
  });

  it('derives gasto from category despesas', async () => {
    await request(app.getHttpServer())
      .post('/api/transactions')
      .set(auth())
      .send({ title: 'Cinema', amount: 90, type: 'DESPESA', accountId, categoryId, date: '2025-06-08' });
    await request(app.getHttpServer())
      .post('/api/budgets')
      .set(auth())
      .send({ title: 'Lazer', description: 'Passeios', limit: 800, categoryId })
      .expect(201);

    const res = await request(app.getHttpServer()).get('/api/budgets').set(auth()).expect(200);
    expect(res.body[0].gasto).toBe(90);
    expect(res.body[0].limite).toBe(800);
  });

  it('rejects a duplicate budget for the same category', async () => {
    await request(app.getHttpServer())
      .post('/api/budgets')
      .set(auth())
      .send({ title: 'Lazer 2', limit: 500, categoryId })
      .expect(409);
  });
});
