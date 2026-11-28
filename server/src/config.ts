import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  APP_TIMEZONE: z.string().default('Asia/Bishkek'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'silent']).default('info'),
});

// JWT_SECRET добавится в схему на этапе 2 (учётные записи).
const env = schema.parse(process.env);

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  timezone: env.APP_TIMEZONE,
  logLevel: env.LOG_LEVEL,
};
