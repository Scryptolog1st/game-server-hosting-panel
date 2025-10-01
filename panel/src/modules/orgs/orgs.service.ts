import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';

@Injectable()
export class OrgsService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrgWithOwner(orgName: string, userId: string) {
    const org = await this.prisma.organization.create({
      data: { name: orgName },
    });
    await this.prisma.membership.create({
      data: { orgId: org.id, userId, role: 'Owner' },
    });
    return org;
  }
}
