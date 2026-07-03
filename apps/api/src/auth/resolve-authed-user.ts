import type { Request } from "express";
import type { Role } from "@fit-sihirbaz/shared";
import type { TokenService } from "./token.service";

export interface AuthedUser {
  id: string;
  role: Role;
}

function extractBearerToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length);
  }
  return undefined;
}

// tRPC context ve REST controller'lar (ör. uploads) arasında paylaşılan JWT çözümleme mantığı.
export function resolveAuthedUser(req: Request, tokenService: TokenService): AuthedUser | null {
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
