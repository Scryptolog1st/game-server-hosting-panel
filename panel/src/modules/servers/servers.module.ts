import { Module } from '@nestjs/common';
import { ServersController } from './servers.controller';
import { ServersService } from './servers.service';
import { DbModule } from '../db/db.module';
import { RolesGuard } from '../auth/roles.guard';
import { AuthModule } from '../auth/auth.module';  // 👈 import to get JwtService
import { JwtGuard } from '../auth/jwt.guard';      // 👈 provide JwtGuard here

@Module({
  imports: [DbModule, AuthModule],                 // 👈 include AuthModule
  controllers: [ServersController],
  providers: [ServersService, RolesGuard, JwtGuard],
})
export class ServersModule { }
