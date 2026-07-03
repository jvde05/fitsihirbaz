import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { TokenService } from "../auth/token.service";
import { type AuthedUser, resolveAuthedUser } from "../auth/resolve-authed-user";

export type { AuthedUser };

export interface Context {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: AuthedUser | null;
}

export function createContextFactory(deps: { tokenService: TokenService }) {
  return function createContext({ req, res }: CreateExpressContextOptions): Context {
    return {
      req,
      res,
      user: resolveAuthedUser(req, deps.tokenService),
    };
  };
}
