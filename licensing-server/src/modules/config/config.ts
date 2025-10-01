import * as dotenv from 'dotenv';
import { z } from 'zod';
dotenv.config();

const EnvSchema = z.object({
  PORT: z.string().default('8081'),
  NODE_ENV: z.enum(['development','test','production']).default('development'),
  LICENSE_SIGNING_SEED: z.string().optional(), // base64 seed (dev only)
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse(process.env);
