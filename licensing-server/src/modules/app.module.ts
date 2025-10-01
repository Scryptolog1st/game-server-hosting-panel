import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { LicenseModule } from './license/license.module';

@Module({
  imports: [HealthModule, LicenseModule],
})
export class AppModule {}
