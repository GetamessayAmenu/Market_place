import { z } from 'zod';

/**
 * Variables shared across all runtime processes.
 * Validated at service bootstrap — never read process.env ad hoc in business code.
 */
export const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production', 'staging']).default('development'),
  APP_URL: z.string().url(),
  API_URL: z.string().url(),
  REALTIME_URL: z.string().url().optional(),
});

export type BaseEnv = z.infer<typeof baseEnvSchema>;

export function parseBaseEnv(env: Record<string, string | undefined> = process.env): BaseEnv {
  return baseEnvSchema.parse(env);
}
