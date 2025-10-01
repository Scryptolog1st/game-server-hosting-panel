import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { OrgsModule } from '../orgs/orgs.module';
import { DbModule } from '../db/db.module';
import { JwtService } from './jwt.service';
import { JwtGuard } from './jwt.guard';

@Module({
  imports: [UsersModule, OrgsModule, DbModule],
  controllers: [AuthController],
  providers: [AuthService, JwtService, JwtGuard],
})
export class AuthModule { }
