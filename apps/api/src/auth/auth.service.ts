import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import type { AuthResponse, AuthTokens, LoginInput, PublicUser, RegisterInput } from "@fit-sihirbaz/shared";
import type { User } from "@fit-sihirbaz/db";
import { PrismaService } from "../prisma/prisma.service";
import { TokenService } from "./token.service";
import { toPublicUser } from "./auth.mapper";
import { MAIL_PROVIDER, type MailProvider } from "../mail/mail.provider";
import { passwordResetEmail, verificationEmail } from "../mail/mail.templates";
import type { Env } from "../config/env.validation";
import {
  AccountInactiveError,
  EmailAlreadyExistsError,
  EmailAlreadyVerifiedError,
  InvalidCredentialsError,
  InvalidEmailTokenError,
  InvalidRefreshTokenError,
} from "./auth.errors";

const BCRYPT_SALT_ROUNDS = 10;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly config: ConfigService<Env, true>,
    @Inject(MAIL_PROVIDER) private readonly mail: MailProvider,
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

    this.sendVerificationEmail(user.id).catch((error) =>
      this.logger.error(`Doğrulama e-postası gönderilemedi (userId=${user.id})`, error),
    );

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

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Hesap yoksa/pasifse de sessizce başarılı dönülür — hesap varlığı sızdırılmaz.
    if (!user || !user.isActive) {
      return;
    }

    const rawToken = randomBytes(32).toString("base64url");
    await this.prisma.$transaction([
      this.prisma.emailToken.deleteMany({
        where: { userId: user.id, type: "PASSWORD_RESET", usedAt: null },
      }),
      this.prisma.emailToken.create({
        data: {
          userId: user.id,
          type: "PASSWORD_RESET",
          tokenHash: hashToken(rawToken),
          expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
        },
      }),
    ]);

    const webAppUrl = this.config.get("WEB_APP_URL", { infer: true });
    const link = `${webAppUrl}/sifre-sifirla?token=${rawToken}`;
    try {
      await this.mail.send({ to: user.email, ...passwordResetEmail(link) });
    } catch (error) {
      this.logger.error(`Şifre sıfırlama e-postası gönderilemedi (userId=${user.id})`, error);
    }
  }

  async resetPassword(rawToken: string, password: string): Promise<void> {
    const token = await this.consumeEmailToken(rawToken, "PASSWORD_RESET");
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: token.userId },
      data: { passwordHash, isEmailVerified: true },
    });
  }

  async sendVerificationEmail(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new InvalidCredentialsError();
    }
    if (user.isEmailVerified) {
      throw new EmailAlreadyVerifiedError();
    }

    const rawToken = randomBytes(32).toString("base64url");
    await this.prisma.$transaction([
      this.prisma.emailToken.deleteMany({
        where: { userId: user.id, type: "EMAIL_VERIFICATION", usedAt: null },
      }),
      this.prisma.emailToken.create({
        data: {
          userId: user.id,
          type: "EMAIL_VERIFICATION",
          tokenHash: hashToken(rawToken),
          expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
        },
      }),
    ]);

    const webAppUrl = this.config.get("WEB_APP_URL", { infer: true });
    const link = `${webAppUrl}/eposta-dogrula?token=${rawToken}`;
    await this.mail.send({ to: user.email, ...verificationEmail(link) });
  }

  async verifyEmail(rawToken: string): Promise<void> {
    const token = await this.consumeEmailToken(rawToken, "EMAIL_VERIFICATION");
    await this.prisma.user.update({
      where: { id: token.userId },
      data: { isEmailVerified: true },
    });
  }

  private async consumeEmailToken(rawToken: string, type: "PASSWORD_RESET" | "EMAIL_VERIFICATION") {
    const token = await this.prisma.emailToken.findUnique({ where: { tokenHash: hashToken(rawToken) } });
    if (!token || token.type !== type || token.usedAt || token.expiresAt < new Date()) {
      throw new InvalidEmailTokenError();
    }
    await this.prisma.emailToken.update({ where: { id: token.id }, data: { usedAt: new Date() } });
    return token;
  }

  private buildAuthResponse(user: User): AuthResponse {
    return {
      user: toPublicUser(user),
      tokens: this.tokens.issuePair(user.id, user.role),
    };
  }
}
