import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { Role } from "@fit-sihirbaz/shared";
import type { TokenService } from "../auth/token.service";

export interface AuthedUser {
  id: string;
  role: Role;
}

export interface Context {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: AuthedUser | null;
}

function extractBearerToken(req: CreateExpressContextOptions["req"]): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length);
  }
  return undefined;
}

function resolveUser(req: CreateExpressContextOptions["req"], tokenService: TokenService): AuthedUser | null {
  const token = extractBearerToken(req) ?? req.cookies?.access_token;
  if (!token) {
    return null;
  }
  try {
    const payload = tokenService.verifyAccessToken(token);
    return { id: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

export function createContextFactory(deps: { tokenService: TokenService }) {
  return function createContext({ req, res }: CreateExpressContextOptions): Context {
    return {
      req,
      res,
      user: resolveUser(req, deps.tokenService),
    };
  };
}
