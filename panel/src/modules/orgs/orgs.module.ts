import { Module } from '@nestjs/common';
import { OrgsService } from './orgs.service';
import { DbModule } from '../db/db.module';

@Module({
  imports: [DbModule],
  providers: [OrgsService],
  exports: [OrgsService],
})
export class OrgsModule {}
