import { Controller, Get, Post, Body, UseGuards, Patch, Param, BadRequestException } from '@nestjs/common';
import { NodesService } from './nodes.service';
import { JwtGuard } from '../auth/jwt.guard';
import { CurrentUser as CU } from '../auth/current-user.decorator';
import { RequireRoles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateTokenDTO, EnrollNodeDTO, HeartbeatDTO } from './nodes.dto';
import { UpdateNodeDTO } from './nodes.dto';
import { z } from 'zod';

function parse<T>(schema: any, body: unknown): T {
  const r = schema.safeParse(body);
  if (!r.success) throw new BadRequestException(r.error.flatten());
  return r.data as T;
}

@Controller('nodes')
export class NodesController {
  constructor(private readonly svc: NodesService) { }

  // List nodes (any org member)
  @UseGuards(JwtGuard)
  @Get()
  async list(@CU() user: any) {
    return this.svc.list(user.org);
  }

  // Create an enrollment token (Owner/Admin)
  @UseGuards(JwtGuard, RolesGuard)
  @RequireRoles('Owner', 'Admin')
  @Post('tokens')
  async createToken(@CU() user: any, @Body() body: unknown) {
    const dto = parse<{ ttlMinutes?: number }>(CreateTokenDTO, body);
    return this.svc.createEnrollmentToken(user.org, user.id, dto.ttlMinutes ?? 60);
  }

  // Agent enrollment (public; secured by one-time token)
  @Post('enroll')
  async enroll(@Body() body: unknown) {
    const dto = parse<{ token: string; name: string; hostname: string }>(EnrollNodeDTO, body);
    return this.svc.enrollNode(dto.token, dto.name, dto.hostname);
  }

  // Agent heartbeat (public; nodeKey auth)
  @Post('heartbeat')
  async heartbeat(@Body() body: unknown) {
    const dto = parse<{ nodeId: string; nodeKey: string; status?: string }>(HeartbeatDTO, body);
    return this.svc.heartbeat(dto.nodeId, dto.nodeKey, dto.status);
  }

    @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @RequireRoles('Owner', 'Admin', 'Operator')
  async update(@CU() user: any, @Param('id') id: string, @Body() body: unknown) {
    const dto = parse<z.infer<typeof UpdateNodeDTO>>(UpdateNodeDTO, body);
    return this.svc.update(user.org, id, dto);
  }
}
