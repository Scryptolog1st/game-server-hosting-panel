import { Body, Controller, Get, Post } from '@nestjs/common';
import { LicenseService } from './license.service';

@Controller('v1/licenses')
export class LicenseController {
  constructor(private readonly svc: LicenseService) {}

  @Get('jwk')
  async jwk() {
    return this.svc.getPublicJwk();
  }

  @Post('activate')
  async activate(@Body() body: any) {
    // TODO: validate activation_code & org. For now, stub entitlements.
    const token = await this.svc.signEntitlement({
      sub: body?.orgId || 'org_dev',
      plan: 'dev',
      limits: { nodes: 1, servers: 3 },
      features: ['mods', 'backups'],
    });
    return { token };
  }
}
