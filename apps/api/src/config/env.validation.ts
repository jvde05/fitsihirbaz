import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL zorunlu"),
  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET en az 16 karakter olmalı"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET en az 16 karakter olmalı"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  // Virgülle ayrılmış izinli web origin listesi (CORS). credentials:true ile birlikte
  // origin:true kullanmak herhangi bir siteden kimlik bilgili istek yapılmasına izin
  // verdiği için (gerçek bir CSRF riski) burada açıkça whitelist tutulur.
  WEB_ORIGIN: z.string().default("http://localhost:3000,http://localhost:8081"),
});

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = EnvSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(`Geçersiz ortam değişkenleri:\n${parsed.error.toString()}`);
  }
  return parsed.data;
}
