import { PrismaService } from '../db/prisma.service';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';


@Injectable()
export class ServersService {
  constructor(private readonly prisma: PrismaService) { }

  async list(orgId: string) {
    return this.prisma.gameServer.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } });
  }

  async get(orgId: string, id: string) {
    const s = await this.prisma.gameServer.findFirst({ where: { id, orgId } });
    if (!s) throw new NotFoundException();
    return s;
  }

  async create(orgId: string, data: any) {
    return this.prisma.gameServer.create({ data: { ...data, orgId } });
  }

  async update(orgId: string, id: string, data: any) {
    const exists = await this.prisma.gameServer.findFirst({ where: { id, orgId } });
    if (!exists) throw new NotFoundException();
    return this.prisma.gameServer.update({ where: { id }, data });
  }

  async remove(orgId: string, id: string) {
    const exists = await this.prisma.gameServer.findFirst({ where: { id, orgId } });
    if (!exists) throw new NotFoundException();
    await this.prisma.gameServer.delete({ where: { id } });
    return { ok: true };
  }

  async assign(orgId: string, id: string, nodeId: string) {
    // ensure both belong to org
    const [srv, node] = await Promise.all([
      this.prisma.gameServer.findFirst({ where: { id, orgId }, select: { id: true } }),
      this.prisma.serverNode.findFirst({ where: { id: nodeId, orgId }, select: { id: true } }),
    ]);
    if (!srv) throw new NotFoundException('Server not found');
    if (!node) throw new NotFoundException('Node not found');
    return this.prisma.gameServer.update({ where: { id }, data: { nodeId } });
  }

  async unassign(orgId: string, id: string) {
    const exists = await this.prisma.gameServer.findFirst({ where: { id, orgId }, select: { id: true } });
    if (!exists) throw new NotFoundException('Server not found');
    return this.prisma.gameServer.update({ where: { id }, data: { nodeId: null } });
  }

  async start(orgId: string, id: string) {
    const s = await this.prisma.gameServer.findFirst({
      where: { id, orgId },
      select: { id: true, nodeId: true, status: true, gameId: true, name: true },
    });
    if (!s) throw new NotFoundException('Server not found');
    if (!s.nodeId) throw new BadRequestException('Server must be assigned to a node before starting');

    const node = await this.prisma.serverNode.findFirst({
      where: { id: s.nodeId, orgId },
      select: { agentUrl: true },
    });
    if (!node || !node.agentUrl) throw new BadRequestException('Node has no agentUrl set');

    // Call agent
    const res = await fetch(`${node.agentUrl}/v1/server/start`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ serverId: id, gameId: s.gameId, name: s.name }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new BadRequestException(`Agent start failed: ${res.status} ${txt}`);
    }

    return this.prisma.gameServer.update({
      where: { id },
      data: { status: 'starting' },
    });
  }

  async stop(orgId: string, id: string) {
    const s = await this.prisma.gameServer.findFirst({
      where: { id, orgId },
      select: { id: true, nodeId: true, gameId: true, name: true },
    });
    if (!s) throw new NotFoundException('Server not found');

    const node = s.nodeId
      ? await this.prisma.serverNode.findFirst({
        where: { id: s.nodeId, orgId },
        select: { agentUrl: true },
      })
      : null;

    if (!node || !node.agentUrl) {
      // allow stop to succeed locally even if agentUrl missing
      return this.prisma.gameServer.update({ where: { id }, data: { status: 'stopped' } });
    }

    const res = await fetch(`${node.agentUrl}/v1/server/stop`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ serverId: id, gameId: s.gameId, name: s.name }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new BadRequestException(`Agent stop failed: ${res.status} ${txt}`);
    }

    return this.prisma.gameServer.update({
      where: { id },
      data: { status: 'stopped' },
    });
  }

  async restart(orgId: string, id: string) {
    const s = await this.prisma.gameServer.findFirst({
      where: { id, orgId },
      select: { id: true, nodeId: true, gameId: true, name: true },
    });
    if (!s) throw new NotFoundException('Server not found');
    if (!s.nodeId) throw new BadRequestException('Server must be assigned to a node before restarting');

    const node = await this.prisma.serverNode.findFirst({
      where: { id: s.nodeId, orgId },
      select: { agentUrl: true },
    });
    if (!node || !node.agentUrl) throw new BadRequestException('Node has no agentUrl set');

    const res = await fetch(`${node.agentUrl}/v1/server/restart`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ serverId: id, gameId: s.gameId, name: s.name }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new BadRequestException(`Agent restart failed: ${res.status} ${txt}`);
    }

    return this.prisma.gameServer.update({
      where: { id },
      data: { status: 'starting' },
    });
  }


}
