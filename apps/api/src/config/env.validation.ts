import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL zorunlu"),
  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET en az 16 karakter olmalı"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET en az 16 karakter olmalı"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  API_PORT: z.coerce.number().int().positive().default(4000),
});

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = EnvSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(`Geçersiz ortam değişkenleri:\n${parsed.error.toString()}`);
  }
  return parsed.data;
}
