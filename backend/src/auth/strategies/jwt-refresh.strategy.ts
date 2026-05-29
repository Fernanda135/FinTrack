import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_REFRESH_SECRET')!,
      passReqToCallback: true,
    });
  }
  validate(req: Request, payload: { sub: string; email: string }) {
    // Case-insensitive scheme strip so the extracted token matches the signed JWT
    // exactly (the refresh-hash comparison depends on byte-for-byte equality).
    const refreshToken = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '').trim();
    return { userId: payload.sub, email: payload.email, refreshToken };
  }
}
