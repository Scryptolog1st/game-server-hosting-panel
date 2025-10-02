import { Module } from '@nestjs/common';
import { NodesController } from './nodes.controller';
import { NodesService } from './nodes.service';
import { DbModule } from '../db/db.module';
import { RolesGuard } from '../auth/roles.guard';
import { AuthModule } from '../auth/auth.module';
import { JwtGuard } from '../auth/jwt.guard';

@Module({
  imports: [DbModule, AuthModule],
  controllers: [NodesController],
  providers: [NodesService, RolesGuard, JwtGuard],
})
export class NodesModule { }
