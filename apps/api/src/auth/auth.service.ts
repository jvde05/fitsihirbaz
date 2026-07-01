import { Injectable } from "@nestjs/common";
import bcrypt from "bcryptjs";
import type { AuthResponse, AuthTokens, LoginInput, PublicUser, RegisterInput } from "@fit-sihirbaz/shared";
import type { User } from "@fit-sihirbaz/db";
import { PrismaService } from "../prisma/prisma.service";
import { TokenService } from "./token.service";
import { toPublicUser } from "./auth.mapper";
import {
  AccountInactiveError,
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from "./auth.errors";

const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new EmailAlreadyExistsError();
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: input.role,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        ...(input.role === "CLIENT"
          ? { clientProfile: { create: {} } }
          : { dietitianProfile: { create: {} } }),
      },
    });

    return this.buildAuthResponse(user);
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new InvalidCredentialsError();
    }
    if (!user.isActive) {
      throw new AccountInactiveError();
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    return this.buildAuthResponse(user);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let userId: string;
    try {
      userId = this.tokens.verifyRefreshToken(refreshToken).sub;
    } catch {
      throw new InvalidRefreshTokenError();
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new InvalidRefreshTokenError();
    }

    return this.tokens.issuePair(user.id, user.role);
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new InvalidCredentialsError();
    }
    return toPublicUser(user);
  }

  private buildAuthResponse(user: User): AuthResponse {
    return {
      user: toPublicUser(user),
      tokens: this.tokens.issuePair(user.id, user.role),
    };
  }
}
