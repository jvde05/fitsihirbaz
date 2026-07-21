import { TRPCError } from "@trpc/server";
import { middleware } from "./trpc";
import type { RateLimiterService } from "../rate-limit/rate-limiter.service";

export const LOGIN_RATE_LIMIT = { max: 10, windowSec: 15 * 60 };
export const REGISTER_RATE_LIMIT = { max: 5, windowSec: 60 * 60 };

// IP bazlı sabit pencere rate limit — brute-force/otomatik deneme koruması.
// Kullanıcı bazlı ikinci bir limit eklenmiyor: input henüz parse edilmemiş olabilir
// (bkz. ROADMAP A2 notu), IP bazlı limit bu görev için yeterli.
export function createIpRateLimitMiddleware(
  limiter: RateLimiterService,
  opts: { name: string; max: number; windowSec: number },
) {
  return middleware(async ({ ctx, next }) => {
    const ip = ctx.req.ip ?? "unknown";
    const allowed = await limiter.isAllowed(`ratelimit:${opts.name}:${ip}`, opts.max, opts.windowSec);
    if (!allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Çok fazla deneme yapıldı, lütfen daha sonra tekrar deneyin",
      });
    }
    return next();
  });
}
