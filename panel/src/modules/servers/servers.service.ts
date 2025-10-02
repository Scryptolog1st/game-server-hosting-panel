import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';

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

}
