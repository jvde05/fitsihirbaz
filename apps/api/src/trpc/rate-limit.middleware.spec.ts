import { TRPCError } from "@trpc/server";
import { createIpRateLimitMiddleware } from "./rate-limit.middleware";
import type { RateLimiterService } from "../rate-limit/rate-limiter.service";

// t.middleware(fn) bir MiddlewareBuilder döner; ham fonksiyona _middlewares[0] üzerinden
// erişilir (bkz. @trpc/server core/middleware.d.ts) — trpc.ts'teki isAuthed/requireRole
// için de aynı builder şekli üretilir, burada sadece izole test amacıyla açılıyor.
function getRawMiddleware(built: ReturnType<typeof createIpRateLimitMiddleware>) {
  return (built as unknown as { _middlewares: unknown[] })._middlewares[0] as (opts: {
    ctx: { req: { ip?: string } };
    next: () => Promise<unknown>;
  }) => Promise<unknown>;
}

describe("createIpRateLimitMiddleware", () => {
  it("limit dahilindeyken next()'i çağırır", async () => {
    const limiter = { isAllowed: jest.fn().mockResolvedValue(true) };
    const mw = getRawMiddleware(
      createIpRateLimitMiddleware(limiter as unknown as RateLimiterService, {
        name: "auth.login",
        max: 10,
        windowSec: 900,
      }),
    );
    const next = jest.fn().mockResolvedValue({ ok: true });

    await mw({ ctx: { req: { ip: "1.2.3.4" } }, next });

    expect(limiter.isAllowed).toHaveBeenCalledWith("ratelimit:auth.login:1.2.3.4", 10, 900);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("limit aşılınca TOO_MANY_REQUESTS fırlatır ve next()'i çağırmaz", async () => {
    const limiter = { isAllowed: jest.fn().mockResolvedValue(false) };
    const mw = getRawMiddleware(
      createIpRateLimitMiddleware(limiter as unknown as RateLimiterService, {
        name: "auth.register",
        max: 5,
        windowSec: 3600,
      }),
    );
    const next = jest.fn();

    await expect(mw({ ctx: { req: { ip: "5.6.7.8" } }, next })).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    } as Partial<TRPCError>);
    expect(next).not.toHaveBeenCalled();
  });

  it("IP bilgisi yoksa 'unknown' anahtarını kullanır", async () => {
    const limiter = { isAllowed: jest.fn().mockResolvedValue(true) };
    const mw = getRawMiddleware(
      createIpRateLimitMiddleware(limiter as unknown as RateLimiterService, {
        name: "auth.login",
        max: 10,
        windowSec: 900,
      }),
    );

    await mw({ ctx: { req: {} }, next: jest.fn().mockResolvedValue({ ok: true }) });

    expect(limiter.isAllowed).toHaveBeenCalledWith("ratelimit:auth.login:unknown", 10, 900);
  });
});
