import { Controller, Get, Post, Patch, Delete, Param, Body, BadRequestException, UseGuards } from '@nestjs/common';
import { ServersService } from './servers.service';
import { JwtGuard } from '../auth/jwt.guard';
import { CurrentUser as CU } from '../auth/current-user.decorator';
import { CreateServerDTO, UpdateServerDTO } from './servers.dto';
import { RequireRoles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AssignServerDTO } from './servers.dto';

function parse<T>(schema: any, body: unknown): T {
  const r = schema.safeParse(body);
  if (!r.success) throw new BadRequestException(r.error.flatten());
  return r.data as T;
}

@UseGuards(JwtGuard)
@Controller('servers')
export class ServersController {
  constructor(private readonly svc: ServersService) { }

  @Get()
  async list(@CU() user: any) {
    return this.svc.list(user.org);
  }

  @Get(':id')
  async get(@CU() user: any, @Param('id') id: string) {
    return this.svc.get(user.org, id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @RequireRoles('Owner', 'Admin', 'Operator')
  async create(@CU() user: any, @Body() body: unknown) {
    const dto = parse<any>(CreateServerDTO, body);
    return this.svc.create(user.org, dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @RequireRoles('Owner', 'Admin', 'Operator')
  async update(@CU() user: any, @Param('id') id: string, @Body() body: unknown) {
    const dto = parse<any>(UpdateServerDTO, body);
    return this.svc.update(user.org, id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @RequireRoles('Owner', 'Admin')
  async remove(@CU() user: any, @Param('id') id: string) {
    return this.svc.remove(user.org, id);
  }

  @Patch(':id/assign')
  @UseGuards(RolesGuard)
  @RequireRoles('Owner', 'Admin', 'Operator')
  async assign(@CU() user: any, @Param('id') id: string, @Body() body: unknown) {
    const dto = parse<{ nodeId: string }>(AssignServerDTO, body);
    return this.svc.assign(user.org, id, dto.nodeId);
  }

  @Patch(':id/unassign')
  @UseGuards(RolesGuard)
  @RequireRoles('Owner', 'Admin', 'Operator')
  async unassign(@CU() user: any, @Param('id') id: string) {
    return this.svc.unassign(user.org, id);
  }

  @Post(':id/start')
  @UseGuards(RolesGuard)
  @RequireRoles('Owner', 'Admin', 'Operator')
  async start(@CU() user: any, @Param('id') id: string) {
    return this.svc.start(user.org, id);
  }

  @Post(':id/stop')
  @UseGuards(RolesGuard)
  @RequireRoles('Owner', 'Admin', 'Operator')
  async stop(@CU() user: any, @Param('id') id: string) {
    return this.svc.stop(user.org, id);
  }

  @Post(':id/restart')
  @UseGuards(RolesGuard)
  @RequireRoles('Owner', 'Admin', 'Operator')
  async restart(@CU() user: any, @Param('id') id: string) {
    return this.svc.restart(user.org, id);
  }

}
