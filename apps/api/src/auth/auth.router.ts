import { TRPCError } from "@trpc/server";
import {
  AckResponseSchema,
  AuthResponseSchema,
  AuthTokensSchema,
  LoginInputSchema,
  MeResponseSchema,
  RefreshInputSchema,
  RegisterInputSchema,
  RequestPasswordResetInputSchema,
  ResetPasswordInputSchema,
  VerifyEmailInputSchema,
} from "@fit-sihirbaz/shared";
import type { Context } from "../trpc/context";
import { protectedProcedure, publicProcedure, router } from "../trpc/trpc";
import {
  createIpRateLimitMiddleware,
  LOGIN_RATE_LIMIT,
  REGISTER_RATE_LIMIT,
} from "../trpc/rate-limit.middleware";
import type { RateLimiterService } from "../rate-limit/rate-limiter.service";
import type { AuthService } from "./auth.service";
import {
  AccountInactiveError,
  EmailAlreadyExistsError,
  EmailAlreadyVerifiedError,
  InvalidCredentialsError,
  InvalidEmailTokenError,
  InvalidRefreshTokenError,
} from "./auth.errors";

const REFRESH_COOKIE_NAME = "refresh_token";
const REFRESH_COOKIE_PATH = "/trpc";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function setRefreshCookie(res: Context["res"], refreshToken: string): void {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: THIRTY_DAYS_MS,
    path: REFRESH_COOKIE_PATH,
  });
}

function clearRefreshCookie(res: Context["res"]): void {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
}

export function createAuthRouter(authService: AuthService, rateLimiter: RateLimiterService) {
  return router({
    register: publicProcedure
      .use(createIpRateLimitMiddleware(rateLimiter, { name: "auth.register", ...REGISTER_RATE_LIMIT }))
      .input(RegisterInputSchema)
      .output(AuthResponseSchema)
      .mutation(async ({ input, ctx }) => {
        try {
          const result = await authService.register(input);
          setRefreshCookie(ctx.res, result.tokens.refreshToken);
          return result;
        } catch (error) {
          if (error instanceof EmailAlreadyExistsError) {
            throw new TRPCError({ code: "CONFLICT", message: "Bu e-posta ile zaten bir hesap var" });
          }
          throw error;
        }
      }),

    login: publicProcedure
      .use(createIpRateLimitMiddleware(rateLimiter, { name: "auth.login", ...LOGIN_RATE_LIMIT }))
      .input(LoginInputSchema)
      .output(AuthResponseSchema)
      .mutation(async ({ input, ctx }) => {
        try {
          const result = await authService.login(input);
          setRefreshCookie(ctx.res, result.tokens.refreshToken);
          return result;
        } catch (error) {
          if (error instanceof InvalidCredentialsError || error instanceof AccountInactiveError) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "E-posta veya şifre hatalı" });
          }
          throw error;
        }
      }),

    refresh: publicProcedure
      .input(RefreshInputSchema)
      .output(AuthTokensSchema)
      .mutation(async ({ input, ctx }) => {
        const refreshToken = input.refreshToken ?? ctx.req.cookies?.[REFRESH_COOKIE_NAME];
        if (!refreshToken) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Refresh token bulunamadı" });
        }
        try {
          const tokens = await authService.refresh(refreshToken);
          setRefreshCookie(ctx.res, tokens.refreshToken);
          return tokens;
        } catch (error) {
          if (error instanceof InvalidRefreshTokenError) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Oturum süresi dolmuş, tekrar giriş yapın" });
          }
          throw error;
        }
      }),

    logout: protectedProcedure.mutation(({ ctx }) => {
      clearRefreshCookie(ctx.res);
      return { success: true };
    }),

    me: protectedProcedure.output(MeResponseSchema).query(({ ctx }) => {
      return authService.me(ctx.user.id);
    }),

    requestPasswordReset: publicProcedure
      .input(RequestPasswordResetInputSchema)
      .output(AckResponseSchema)
      .mutation(async ({ input }) => {
        await authService.requestPasswordReset(input.email);
        return { success: true };
      }),

    resetPassword: publicProcedure
      .input(ResetPasswordInputSchema)
      .output(AckResponseSchema)
      .mutation(async ({ input }) => {
        try {
          await authService.resetPassword(input.token, input.password);
          return { success: true };
        } catch (error) {
          if (error instanceof InvalidEmailTokenError) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Bağlantı geçersiz veya süresi dolmuş" });
          }
          throw error;
        }
      }),

    verifyEmail: publicProcedure
      .input(VerifyEmailInputSchema)
      .output(AckResponseSchema)
      .mutation(async ({ input }) => {
        try {
          await authService.verifyEmail(input.token);
          return { success: true };
        } catch (error) {
          if (error instanceof InvalidEmailTokenError) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Bağlantı geçersiz veya süresi dolmuş" });
          }
          throw error;
        }
      }),

    resendVerificationEmail: protectedProcedure.output(AckResponseSchema).mutation(async ({ ctx }) => {
      try {
        await authService.sendVerificationEmail(ctx.user.id);
        return { success: true };
      } catch (error) {
        if (error instanceof EmailAlreadyVerifiedError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "E-posta zaten doğrulanmış" });
        }
        throw error;
      }
    }),
  });
}
