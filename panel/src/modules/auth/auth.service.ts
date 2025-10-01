import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { OrgsService } from '../orgs/orgs.service';
import { PrismaService } from '../db/prisma.service';
import { JwtService } from './jwt.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly orgs: OrgsService,
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(email: string, password: string, orgName: string) {
    const u = await this.users.createUser(email, password);
    const org = await this.orgs.createOrgWithOwner(orgName, u.id);
    const tokens = await this.issueTokens(u.id, org.id);
    return { userId: u.id, orgId: org.id, ...tokens };
  }

  async login(email: string, password: string) {
    const u = await this.users.verifyUser(email, password);
    if (!u) throw new UnauthorizedException('Invalid credentials');
    // find default org membership (first membership)
    const m = await this.prisma.membership.findFirst({ where: { userId: u.id } });
    const orgId = m?.orgId ?? '';
    const tokens = await this.issueTokens(u.id, orgId);
    return { userId: u.id, orgId, ...tokens };
  }

  private async issueTokens(userId: string, orgId: string) {
    const access = await this.jwt.signAccess({ sub: userId, org: orgId });
    const refresh = await this.jwt.signRefresh({ sub: userId, org: orgId });
    // store hashed refresh token
    const tokenHash = crypto.createHash('sha256').update(refresh).digest('hex');
    const exp = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt: exp },
    });
    return { access, refresh };
  }

  async refresh(refreshToken: string) {
    const { payload } = await this.jwt.verify(refreshToken);
    if (payload?.typ !== 'refresh') throw new UnauthorizedException('Not a refresh token');
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const stored = await this.prisma.refreshToken.findFirst({ where: { tokenHash, revokedAt: null } });
    if (!stored || stored.expiresAt < new Date()) throw new UnauthorizedException('Refresh expired or revoked');
    // rotate
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    const access = await this.jwt.signAccess({ sub: payload.sub, org: payload.org });
    const nextRefresh = await this.jwt.signRefresh({ sub: payload.sub, org: payload.org });
    const nextHash = crypto.createHash('sha256').update(nextRefresh).digest('hex');
    const exp = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    await this.prisma.refreshToken.create({ data: { userId: String(payload.sub), tokenHash: nextHash, expiresAt: exp } });
    return { access, refresh: nextRefresh };
  }
}
