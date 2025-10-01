import * as dotenv from 'dotenv';
import { z } from 'zod';
dotenv.config();

const EnvSchema = z.object({
  PORT: z.string().default('8080'),
  NODE_ENV: z.enum(['development','test','production']).default('development'),
  DATABASE_URL: z.string().min(10),
  NATS_URL: z.string().default('nats://localhost:4222'),
  S3_ENDPOINT: z.string().default('http://localhost:9000'),
  S3_ACCESS_KEY: z.string().default('dev'),
  S3_SECRET_KEY: z.string().default('devsecret'),
  LICENSE_SERVER_URL: z.string().default('http://localhost:8081'),
  JWT_ISSUER: z.string().default('panel.local'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  JWT_SECRET: z.string().min(10),
});

export type Env = z.infer<typeof EnvSchema>;
export const env: Env = EnvSchema.parse(process.env);
