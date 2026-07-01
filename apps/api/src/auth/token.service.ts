import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import jwt from "jsonwebtoken";
import type { AuthTokens, Role } from "@fit-sihirbaz/shared";
import type { Env } from "../config/env.validation";

export interface AccessTokenPayload {
  sub: string;
  role: Role;
}

export interface RefreshTokenPayload {
  sub: string;
}

@Injectable()
export class TokenService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  issuePair(userId: string, role: Role): AuthTokens {
    return {
      accessToken: this.signAccessToken(userId, role),
      refreshToken: this.signRefreshToken(userId),
    };
  }

  signAccessToken(userId: string, role: Role): string {
    const secret: jwt.Secret = this.config.getOrThrow("JWT_ACCESS_SECRET", { infer: true });
    const options: jwt.SignOptions = {
      expiresIn: this.config.getOrThrow("JWT_ACCESS_EXPIRES_IN", { infer: true }) as jwt.SignOptions["expiresIn"],
    };
    return jwt.sign({ sub: userId, role } satisfies AccessTokenPayload, secret, options);
  }

  signRefreshToken(userId: string): string {
    const secret: jwt.Secret = this.config.getOrThrow("JWT_REFRESH_SECRET", { infer: true });
    const options: jwt.SignOptions = {
      expiresIn: this.config.getOrThrow("JWT_REFRESH_EXPIRES_IN", { infer: true }) as jwt.SignOptions["expiresIn"],
    };
    return jwt.sign({ sub: userId } satisfies RefreshTokenPayload, secret, options);
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const secret: jwt.Secret = this.config.getOrThrow("JWT_ACCESS_SECRET", { infer: true });
    return jwt.verify(token, secret) as AccessTokenPayload;
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    const secret: jwt.Secret = this.config.getOrThrow("JWT_REFRESH_SECRET", { infer: true });
    return jwt.verify(token, secret) as RefreshTokenPayload;
  }
}
