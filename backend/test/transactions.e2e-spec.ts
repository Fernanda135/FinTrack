import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Transactions (e2e)', () => {
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
      .post('/api/auth/register').send({ email: `tx${Date.now()}@t.com`, name: 'Tx', password: 'supersecret' });
    token = reg.body.accessToken;
    const acc = await request(app.getHttpServer()).post('/api/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ label: 'Conta', type: 'CARTEIRA', balance: 1000, color: '#22C55E' });
    accountId = acc.body.id;
    const cat = await request(app.getHttpServer()).post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ label: 'Mercado', value: 'mercado' });
    categoryId = cat.body.id;
  });
  afterAll(async () => app.close());
  const auth = () => ({ Authorization: `Bearer ${token}` });

  it('despesa decreases account balance', async () => {
    const created = await request(app.getHttpServer()).post('/api/transactions').set(auth())
      .send({ title: 'Compra', amount: 200, type: 'DESPESA', accountId, categoryId, date: '2025-06-03' })
      .expect(201);
    // the create response itself must reflect the post-transaction balance (not stale)
    expect(created.body.account.balance).toBe(800);
    const accs = await request(app.getHttpServer()).get('/api/accounts').set(auth());
    expect(accs.body[0].balance).toBe(800);
  });

  it("rejects a transaction into an account that is not the user's (404)", async () => {
    await request(app.getHttpServer()).post('/api/transactions').set(auth())
      .send({ title: 'X', amount: 10, type: 'DESPESA', accountId: 'nonexistent', categoryId, date: '2025-06-03' })
      .expect(404);
  });

  it('lists transactions with joined account & category', async () => {
    const res = await request(app.getHttpServer()).get('/api/transactions').set(auth()).expect(200);
    expect(res.body[0]).toHaveProperty('account.label');
    expect(res.body[0]).toHaveProperty('category.label');
  });

  it('deleting a despesa restores the balance', async () => {
    const list = await request(app.getHttpServer()).get('/api/transactions').set(auth());
    const id = list.body[0].id;
    await request(app.getHttpServer()).delete(`/api/transactions/${id}`).set(auth()).expect(200);
    const accs = await request(app.getHttpServer()).get('/api/accounts').set(auth());
    expect(accs.body[0].balance).toBe(1000);
  });

  it('updating amount rebalances the account', async () => {
    const created = await request(app.getHttpServer()).post('/api/transactions').set(auth())
      .send({ title: 'X', amount: 100, type: 'DESPESA', accountId, categoryId, date: '2025-06-05' });
    // create the transaction, then change its amount to 250 and assert the account rebalances
    await request(app.getHttpServer()).patch(`/api/transactions/${created.body.id}`).set(auth())
      .send({ amount: 250 }).expect(200);
    const accs = await request(app.getHttpServer()).get('/api/accounts').set(auth());
    // assert the balance reflects a 250 despesa for THIS created tx relative to the balance just before it
    expect(accs.body[0].balance).toBe(created.body.account.balance - 150);
  });
});
