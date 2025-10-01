import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './modules/app.module';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new FastifyAdapter({ logger: true }));
  app.enableCors({ origin: true, credentials: true });
  const port = process.env.PORT || 8080;
  await app.listen(port as number, '0.0.0.0');
  console.log(`Panel API running on port ${port}`);
}
bootstrap();
