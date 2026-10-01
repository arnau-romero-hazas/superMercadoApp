import { existsSync } from 'node:fs';
import { z } from 'zod';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const entornoSchema = z.object({
  PORT: z.coerce.number().int().default(3000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  CORS_ORIGIN: z.string().min(1),
  CRON_SECRET: z.string().min(16),
});

export const entorno = entornoSchema.parse(process.env);
