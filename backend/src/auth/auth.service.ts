import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  // A hashing promise started once at construction. Awaited during login when the
  // email is unknown, so an attacker cannot distinguish "no such user" from
  // "wrong password" by response latency (the verify always runs against some hash).
  private readonly dummyHash: Promise<string> = argon2.hash('argon2-timing-sentinel');

  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email já cadastrado');
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.users.create({ email: dto.email, name: dto.name, passwordHash });

    await this.prisma.category.createMany({
      data: [
        { userId: user.id, label: 'Alimentação', value: 'alimentacao', isIncome: false },
        { userId: user.id, label: 'Transporte', value: 'transporte', isIncome: false },
        { userId: user.id, label: 'Moradia', value: 'moradia', isIncome: false },
        { userId: user.id, label: 'Assinaturas', value: 'assinaturas', isIncome: false },
        { userId: user.id, label: 'Saúde', value: 'saude', isIncome: false },
        { userId: user.id, label: 'Lazer', value: 'lazer', isIncome: false },
        { userId: user.id, label: 'Educação', value: 'educacao', isIncome: false },

        { userId: user.id, label: 'Renda', value: 'renda', isIncome: true },
      ],
    });

    return this.issueTokens(user.id, user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    // Always run a verify (against a dummy hash when the user is missing) so the
    // response time does not leak whether the email exists.
    const hash = user?.passwordHash ?? (await this.dummyHash);
    const ok = await argon2.verify(hash, dto.password);
    if (!user || !ok) throw new UnauthorizedException('Credenciais inválidas');
    return this.issueTokens(user.id, user.email);
  }

  async logout(userId: string) {
    await this.users.setRefreshHash(userId, null);
    return { success: true };
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.users.findById(userId);
    if (!user || !user.refreshHash) throw new UnauthorizedException();
    const ok = await argon2.verify(user.refreshHash, refreshToken);
    if (!ok) throw new UnauthorizedException();
    return this.issueTokens(user.id, user.email);
  }

  private async issueTokens(userId: string, email: string) {
    // A unique jti per token guarantees each issued token is a distinct string,
    // even when two are signed within the same second. Without it, JWTs with an
    // identical payload+iat are byte-identical, which would defeat refresh-token
    // rotation (an "old" token would still match the freshly stored hash).
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: userId, email, jti: randomUUID() },
        {
          secret: this.config.get('JWT_ACCESS_SECRET'),
          expiresIn: this.config.get('JWT_ACCESS_TTL'),
        },
      ),
      this.jwt.signAsync(
        { sub: userId, email, jti: randomUUID() },
        {
          secret: this.config.get('JWT_REFRESH_SECRET'),
          expiresIn: this.config.get('JWT_REFRESH_TTL'),
        },
      ),
    ]);
    await this.users.setRefreshHash(userId, await argon2.hash(refreshToken));
    return { accessToken, refreshToken };
  }
}
