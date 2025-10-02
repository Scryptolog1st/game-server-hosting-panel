import { UpdateNodeDTO } from './nodes.dto'; // top
import { z } from 'zod';
import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import * as crypto from 'crypto';


function sha256(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex');
}
function randomToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('base64url');
}

@Injectable()
export class NodesService {
  constructor(private readonly prisma: PrismaService) { }

  async list(orgId: string) {
    return this.prisma.serverNode.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, hostname: true, status: true, lastSeenAt: true, createdAt: true,
      },
    });
  }

  async update(orgId: string, id: string, data: z.infer<typeof UpdateNodeDTO>) {
    const node = await this.prisma.serverNode.findFirst({ where: { id, orgId }, select: { id: true } });
    if (!node) throw new NotFoundException('Node not found');
    return this.prisma.serverNode.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.hostname ? { hostname: data.hostname } : {}),
        ...(data.agentUrl !== undefined ? { agentUrl: data.agentUrl } : {}),
      },
    });
  }

  async createEnrollmentToken(orgId: string, createdById: string, ttlMinutes = 60) {
    const token = randomToken(32);
    const tokenHash = sha256(token);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);

    await this.prisma.enrollmentToken.create({
      data: { orgId, tokenHash, createdById, expiresAt },
    });

    // Return plaintext token ONCE
    return { token, expiresAt };
  }

  async enrollNode(token: string, name: string, hostname: string) {
    const tokenHash = sha256(token);
    const t = await this.prisma.enrollmentToken.findFirst({
      where: { tokenHash, revokedAt: null },
    });
    if (!t) throw new ForbiddenException('Invalid token');
    if (t.expiresAt < new Date()) throw new ForbiddenException('Token expired');

    const nodeKey = randomToken(32);
    const nodeKeyHash = sha256(nodeKey);

    const node = await this.prisma.serverNode.create({
      data: {
        orgId: t.orgId,
        name,
        hostname,
        status: 'online',
        lastSeenAt: new Date(),
        nodeKeyHash, // 👈 now valid in schema
      },
      select: {
        id: true, orgId: true, name: true, hostname: true, status: true, lastSeenAt: true, createdAt: true,
      },
    });

    return { node, nodeKey }; // nodeKey is shown once to the agent
  }

  async heartbeat(nodeId: string, nodeKey: string, status?: string) {
    const n = await this.prisma.serverNode.findUnique({
      where: { id: nodeId },
      select: { id: true, nodeKeyHash: true }, // 👈 include nodeKeyHash for TS
    });
    if (!n) throw new NotFoundException('Node not found');

    const ok = !!n.nodeKeyHash && n.nodeKeyHash === sha256(nodeKey);
    if (!ok) throw new ForbiddenException('Bad node credentials');

    const newStatus = status ?? 'online';
    await this.prisma.serverNode.update({
      where: { id: nodeId },
      data: { lastSeenAt: new Date(), status: newStatus },
    });
    return { ok: true };
  }
}
