import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  CONSOLE_ORIGIN: z.string().url().default("http://localhost:3002"),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32)
    .default("development-access-secret-change-before-production"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32)
    .default("development-refresh-secret-change-before-production"),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 24 * 7),
  SEED_OWNER_EMAIL: z.string().email().default("owner@guidora.local"),
  SEED_OWNER_PASSWORD: z.string().min(8).default("password123"),
  SEED_OWNER_NAME: z.string().min(1).default("Guidora Owner")
});

export type ApiEnvironment = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): ApiEnvironment {
  return envSchema.parse(config);
}
