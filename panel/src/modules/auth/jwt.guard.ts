import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from './jwt.service';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) { }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const auth = String(req.headers?.authorization || '');
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) throw new UnauthorizedException('Missing Authorization: Bearer <token>');
    try {
      const { payload } = await this.jwt.verify(token);
      req.user = { id: payload.sub, org: payload.org };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
