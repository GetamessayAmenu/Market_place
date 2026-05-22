import { z } from 'zod';

export const webEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_REALTIME_URL: z.string().url().optional(),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

export function parseWebEnv(env: Record<string, string | undefined> = process.env): WebEnv {
  return webEnvSchema.parse(env);
}
