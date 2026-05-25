import { z } from 'zod';

import { baseEnvSchema } from './base.env.js';

export const realtimeEnvSchema = baseEnvSchema.extend({
  PORT: z.coerce.number().int().positive().default(3002),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  CORS_ORIGINS: z
    .string()
    .transform((s) => s.split(',').map((o) => o.trim()))
    .pipe(z.array(z.string().url())),
  MAX_MESSAGE_LENGTH: z.coerce.number().int().positive().default(4000),
  TYPING_INDICATOR_TTL_MS: z.coerce.number().int().positive().default(5000),
});

export type RealtimeEnv = z.infer<typeof realtimeEnvSchema>;

export function parseRealtimeEnv(
  env: Record<string, string | undefined> = process.env,
): RealtimeEnv {
  return realtimeEnvSchema.parse(env);
}
