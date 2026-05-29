import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Categories (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    const email = `cat${Date.now()}@t.com`;
    const reg = await request(app.getHttpServer())
      .post('/api/auth/register').send({ email, name: 'Cat', password: 'supersecret' });
    token = reg.body.accessToken;
  });
  afterAll(async () => app.close());

  it('requires auth', async () => {
    await request(app.getHttpServer()).get('/api/categories').expect(401);
  });

  it('creates and lists categories with aggregate fields', async () => {
    await request(app.getHttpServer())
      .post('/api/categories').set('Authorization', `Bearer ${token}`)
      .send({ label: 'Mercado', value: 'mercado', isIncome: false }).expect(201);

    const res = await request(app.getHttpServer())
      .get('/api/categories').set('Authorization', `Bearer ${token}`).expect(200);
    const cat = res.body.find((c: any) => c.value === 'mercado');
    expect(cat).toBeDefined();
    expect(cat).toHaveProperty('valor');       // derived spend
    expect(cat).toHaveProperty('transacoes');  // derived count
  });
});
