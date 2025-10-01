import { Body, Controller, Get, Post, BadRequestException } from '@nestjs/common';
import { LicenseService } from './license.service';
import { ActivationRequest, RefreshRequest, RevokeRequest } from './types';

@Controller('v1/licenses')
export class LicenseController {
  constructor(private readonly svc: LicenseService) {}

  @Get('jwk')
  async jwk() {
    return this.svc.getPublicJwk();
  }

  @Get('crl')
  crl() {
    return { revoked: this.svc.listCRL() };
  }

  @Post('activate')
  async activate(@Body() body: unknown) {
    const parsed = ActivationRequest.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    // TODO: validate activationCode via persistence/payment webhook
    const token = await this.svc.signEntitlement({
      sub: parsed.data.orgId,
      plan: parsed.data.plan,
      limits: { nodes: 1, servers: 3 },
      features: ['mods', 'backups'],
    });
    return { token };
  }

  @Post('refresh')
  async refresh(@Body() body: unknown) {
    const parsed = RefreshRequest.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const verified = await this.svc.verify(parsed.data.token);
    const { sub, plan, limits, features } = verified.payload as any;
    const token = await this.svc.signEntitlement({ sub, plan, limits, features }, '7d');
    return { token };
  }

  @Post('revoke')
  async revoke(@Body() body: unknown) {
    const parsed = RevokeRequest.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const entry = await this.svc.revoke(parsed.data.jti, parsed.data.reason);
    return { ok: true, entry };
  }
}
