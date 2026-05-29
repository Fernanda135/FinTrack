import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  const email = `u${Date.now()}@t.com`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });
  afterAll(async () => app.close());

  it('registers then logs in', async () => {
    const reg = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, name: 'Test', password: 'supersecret' })
      .expect(201);
    expect(reg.body.accessToken).toBeDefined();

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'supersecret' })
      .expect(200);
    expect(login.body.refreshToken).toBeDefined();
  });

  it('rejects duplicate registration', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, name: 'Test', password: 'supersecret' })
      .expect(409);
  });

  it('rotates refresh tokens and invalidates the old one; logout revokes refresh', async () => {
    const server = app.getHttpServer();

    // Fresh session
    const login = await request(server)
      .post('/api/auth/login')
      .send({ email, password: 'supersecret' })
      .expect(200);
    const rt1 = login.body.refreshToken as string;
    expect(rt1).toBeDefined();

    // Refresh with rt1 → new tokens (rotation replaces the stored hash)
    const refreshed = await request(server)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${rt1}`)
      .expect(200);
    const rt2 = refreshed.body.refreshToken as string;
    const at2 = refreshed.body.accessToken as string;
    expect(rt2).toBeDefined();
    expect(at2).toBeDefined();

    // rt1 is now stale → must be rejected (proves rotation)
    await request(server)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${rt1}`)
      .expect(401);

    // logout (access token) clears the stored refresh hash
    await request(server)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${at2}`)
      .expect(200);

    // rt2 no longer works after logout (proves revocation)
    await request(server)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${rt2}`)
      .expect(401);
  });

  it('rejects a protected route without a token', async () => {
    await request(app.getHttpServer()).post('/api/auth/logout').expect(401);
  });
});
