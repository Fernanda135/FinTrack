import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  const users = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    setRefreshHash: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: JwtService, useValue: { signAsync: jest.fn().mockResolvedValue('tok') } },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('secret') } },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('rejects login with wrong password', async () => {
    users.findByEmail.mockResolvedValue({
      id: '1', email: 'a@b.c', name: 'A',
      passwordHash: await argon2.hash('right'),
    });
    await expect(service.login({ email: 'a@b.c', password: 'wrong' }))
      .rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('issues tokens on valid login', async () => {
    users.findByEmail.mockResolvedValue({
      id: '1', email: 'a@b.c', name: 'A',
      passwordHash: await argon2.hash('right'),
    });
    const res = await service.login({ email: 'a@b.c', password: 'right' });
    expect(res.accessToken).toBeDefined();
    expect(res.refreshToken).toBeDefined();
  });
});
