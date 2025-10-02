import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { DbModule } from './db/db.module';
import { UsersModule } from './users/users.module';
import { OrgsModule } from './orgs/orgs.module';
import { AuthModule } from './auth/auth.module';
import { ServersModule } from './servers/servers.module';
import { NodesModule } from './nodes/nodes.module';

@Module({
  imports: [HealthModule, DbModule, UsersModule, OrgsModule, AuthModule, ServersModule, NodesModule],
})
export class AppModule {}
