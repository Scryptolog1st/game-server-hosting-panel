import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../db/prisma.service';
import { ROLES_KEY } from './roles.decorator';
import type { Role } from './roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) { }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]) || [];

    if (required.length === 0) return true; // no role requirement

    const req = ctx.switchToHttp().getRequest();
    const user = req.user as { id: string; org: string } | undefined;
    if (!user?.id || !user?.org) throw new UnauthorizedException();

    const membership = await this.prisma.membership.findFirst({
      where: { userId: user.id, orgId: user.org },
      select: { role: true },
    });

    if (!membership) throw new ForbiddenException('No membership in org');
    if (!required.includes(membership.role as Role)) {
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }
}
