import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.url(),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_TTL: z.string().default('900s'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  PORT: z.coerce.number().default(3000),
  CORS_ORIGINS: z.string().default('http://localhost:8081'),
});

export type Env = z.infer<typeof schema>;

export function validateEnv(env: Record<string, unknown>): Env {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    throw new Error('Invalid environment: ' + parsed.error.toString());
  }
  return parsed.data;
}
