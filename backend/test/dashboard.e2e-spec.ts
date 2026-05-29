import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Dashboard (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    const reg = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: `dash${Date.now()}@t.com`, name: 'Dash', password: 'supersecret' });
    token = reg.body.accessToken;
    const auth = { Authorization: `Bearer ${token}` };
    const acc = await request(app.getHttpServer())
      .post('/api/accounts')
      .set(auth)
      .send({ label: 'C', type: 'CARTEIRA', balance: 1000 });
    const cat = await request(app.getHttpServer())
      .post('/api/categories')
      .set(auth)
      .send({ label: 'Renda', value: 'renda', isIncome: true });
    await request(app.getHttpServer())
      .post('/api/transactions')
      .set(auth)
      .send({
        title: 'Salário',
        amount: 500,
        type: 'RECEITA',
        accountId: acc.body.id,
        categoryId: cat.body.id,
        date: '2025-06-01',
      });
  });
  afterAll(async () => app.close());

  it('returns aggregated dashboard summary', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.saldoTotal).toBe(1500); // 1000 initial + 500 receita
    expect(res.body.receitaTotal).toBe(500);
    expect(res.body.gastoTotal).toBe(0);
    expect(Array.isArray(res.body.ultimasTransacoes)).toBe(true);
    expect(res.body).toHaveProperty('orcAtivos');
  });
});
