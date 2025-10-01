import { Injectable } from '@nestjs/common';
import { SignJWT, jwtVerify } from 'jose';
import { env } from '../config/config';

function getSecretKey() {
  return new TextEncoder().encode(env.JWT_SECRET);
}

@Injectable()
export class JwtService {
  async signAccess(payload: object) {
    return await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer(env.JWT_ISSUER)
      .setIssuedAt()
      .setExpirationTime(env.JWT_ACCESS_TTL)
      .sign(getSecretKey());
  }
  async signRefresh(payload: object) {
    return await new SignJWT({ ...payload, typ: 'refresh' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer(env.JWT_ISSUER)
      .setIssuedAt()
      .setExpirationTime(env.JWT_REFRESH_TTL)
      .sign(getSecretKey());
  }
  async verify(token: string) {
    return await jwtVerify(token, getSecretKey(), { issuer: env.JWT_ISSUER });
  }
}
