import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(email: string, password: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('Email already registered');
    const passhash = await bcrypt.hash(password, 12);
    return this.prisma.user.create({ data: { email, passhash } });
  }

  async verifyUser(email: string, password: string) {
    const u = await this.prisma.user.findUnique({ where: { email } });
    if (!u) return null;
    const ok = await bcrypt.compare(password, u.passhash);
    return ok ? u : null;
  }

  async getById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
