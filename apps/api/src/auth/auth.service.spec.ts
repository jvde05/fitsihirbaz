import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { TokenService } from "./token.service";
import type { MailProvider } from "../mail/mail.provider";
import {
  AccountInactiveError,
  EmailAlreadyExistsError,
  EmailAlreadyVerifiedError,
  InvalidCredentialsError,
  InvalidEmailTokenError,
  InvalidRefreshTokenError,
} from "./auth.errors";

function buildUserRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "user-1",
    email: "test@example.com",
    passwordHash: "",
    role: "CLIENT",
    firstName: "Ada",
    lastName: "Lovelace",
    phone: null,
    avatarUrl: null,
    isEmailVerified: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildEmailTokenRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "token-1",
    userId: "user-1",
    tokenHash: "irrelevant-in-mock",
    type: "PASSWORD_RESET",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    usedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

const ENV_VALUES: Record<string, string> = { WEB_APP_URL: "http://localhost:3000" };

describe("AuthService", () => {
  let prisma: {
    user: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    emailToken: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock; deleteMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let tokens: { issuePair: jest.Mock; verifyRefreshToken: jest.Mock };
  let config: { get: jest.Mock; getOrThrow: jest.Mock };
  let mail: { send: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      emailToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(async (ops: unknown[]) => ops),
    };
    tokens = {
      issuePair: jest.fn().mockReturnValue({ accessToken: "access", refreshToken: "refresh" }),
      verifyRefreshToken: jest.fn(),
    };
    config = {
      get: jest.fn((key: string) => ENV_VALUES[key]),
      getOrThrow: jest.fn((key: string) => ENV_VALUES[key]),
    };
    mail = { send: jest.fn().mockResolvedValue(undefined) };
    service = new AuthService(
      prisma as unknown as PrismaService,
      tokens as unknown as TokenService,
      config as never,
      mail as unknown as MailProvider,
    );
  });

  describe("register", () => {
    it("e-posta zaten kayıtlıysa EmailAlreadyExistsError fırlatır", async () => {
      prisma.user.findUnique.mockResolvedValue(buildUserRow());

      await expect(
        service.register({
          email: "test@example.com",
          password: "Sifre123",
          role: "CLIENT",
          firstName: "Ada",
          lastName: "Lovelace",
        }),
      ).rejects.toBeInstanceOf(EmailAlreadyExistsError);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("yeni kullanıcı oluşturur, şifreyi hashler ve token döner", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) =>
        buildUserRow({ passwordHash: data.passwordHash, role: data.role }),
      );

      const result = await service.register({
        email: "test@example.com",
        password: "Sifre123",
        role: "CLIENT",
        firstName: "Ada",
        lastName: "Lovelace",
      });

      expect(prisma.user.create).toHaveBeenCalledTimes(1);
      const createArgs = prisma.user.create.mock.calls[0][0];
      expect(createArgs.data.passwordHash).not.toBe("Sifre123");
      expect(createArgs.data.clientProfile).toEqual({ create: {} });
      expect(result.user.email).toBe("test@example.com");
      expect(result.tokens).toEqual({ accessToken: "access", refreshToken: "refresh" });
    });

    it("DIETITIAN rolü için dietitianProfile oluşturur", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(buildUserRow({ role: "DIETITIAN" }));

      await service.register({
        email: "dyt@example.com",
        password: "Sifre123",
        role: "DIETITIAN",
        firstName: "Ada",
        lastName: "Lovelace",
      });

      const createArgs = prisma.user.create.mock.calls[0][0];
      expect(createArgs.data.dietitianProfile).toEqual({ create: {} });
      expect(createArgs.data.clientProfile).toBeUndefined();
    });

    it("kayıt sonrası doğrulama e-postası tetiklenir (fire-and-forget)", async () => {
      const createdUser = buildUserRow({ isEmailVerified: false });
      prisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(createdUser);
      prisma.user.create.mockResolvedValue(createdUser);

      await service.register({
        email: "test@example.com",
        password: "Sifre123",
        role: "CLIENT",
        firstName: "Ada",
        lastName: "Lovelace",
      });
      await flushPromises();

      expect(prisma.emailToken.create).toHaveBeenCalledTimes(1);
      expect(mail.send).toHaveBeenCalledTimes(1);
      expect(mail.send.mock.calls[0][0].to).toBe(createdUser.email);
      expect(mail.send.mock.calls[0][0].text).toContain("/eposta-dogrula?token=");
    });
  });

  describe("login", () => {
    it("kullanıcı bulunamazsa InvalidCredentialsError fırlatır", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: "yok@example.com", password: "Sifre123" }),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
    });

    it("hesap pasifse AccountInactiveError fırlatır", async () => {
      prisma.user.findUnique.mockResolvedValue(buildUserRow({ isActive: false }));

      await expect(
        service.login({ email: "test@example.com", password: "Sifre123" }),
      ).rejects.toBeInstanceOf(AccountInactiveError);
    });

    it("şifre yanlışsa InvalidCredentialsError fırlatır", async () => {
      prisma.user.findUnique.mockResolvedValue(buildUserRow({ passwordHash: "$2a$10$invalidhash" }));

      await expect(
        service.login({ email: "test@example.com", password: "yanlisSifre1" }),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
    });

    it("register ile oluşturulan hash ile doğru şifre kabul edilir", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      let storedHash = "";
      prisma.user.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
        storedHash = data.passwordHash as string;
        return buildUserRow({ passwordHash: storedHash });
      });

      await service.register({
        email: "test@example.com",
        password: "DogruSifre1",
        role: "CLIENT",
        firstName: "Ada",
        lastName: "Lovelace",
      });

      prisma.user.findUnique.mockResolvedValue(buildUserRow({ passwordHash: storedHash }));
      const result = await service.login({ email: "test@example.com", password: "DogruSifre1" });
      expect(result.user.email).toBe("test@example.com");
    });
  });

  describe("refresh", () => {
    it("geçersiz refresh token için InvalidRefreshTokenError fırlatır", async () => {
      tokens.verifyRefreshToken.mockImplementation(() => {
        throw new Error("jwt malformed");
      });

      await expect(service.refresh("bozuk-token")).rejects.toBeInstanceOf(InvalidRefreshTokenError);
    });

    it("kullanıcı artık yoksa InvalidRefreshTokenError fırlatır", async () => {
      tokens.verifyRefreshToken.mockReturnValue({ sub: "user-1" });
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.refresh("gecerli-token")).rejects.toBeInstanceOf(InvalidRefreshTokenError);
    });

    it("geçerli token için yeni bir token çifti döner", async () => {
      tokens.verifyRefreshToken.mockReturnValue({ sub: "user-1" });
      prisma.user.findUnique.mockResolvedValue(buildUserRow());

      const result = await service.refresh("gecerli-token");
      expect(result).toEqual({ accessToken: "access", refreshToken: "refresh" });
      expect(tokens.issuePair).toHaveBeenCalledWith("user-1", "CLIENT");
    });
  });

  describe("requestPasswordReset", () => {
    it("bilinmeyen e-postada sessizce döner, mail gönderilmez", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await service.requestPasswordReset("yok@example.com");

      expect(prisma.emailToken.create).not.toHaveBeenCalled();
      expect(mail.send).not.toHaveBeenCalled();
    });

    it("pasif hesapta sessizce döner, mail gönderilmez", async () => {
      prisma.user.findUnique.mockResolvedValue(buildUserRow({ isActive: false }));

      await service.requestPasswordReset("test@example.com");

      expect(mail.send).not.toHaveBeenCalled();
    });

    it("bilinen e-postada token yaratır ve mail gönderir", async () => {
      prisma.user.findUnique.mockResolvedValue(buildUserRow());

      await service.requestPasswordReset("test@example.com");

      expect(prisma.emailToken.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ type: "PASSWORD_RESET" }) }),
      );
      expect(prisma.emailToken.create).toHaveBeenCalledTimes(1);
      expect(mail.send).toHaveBeenCalledTimes(1);
      expect(mail.send.mock.calls[0][0].text).toContain("/sifre-sifirla?token=");
    });

    it("mail gönderimi patlarsa yine de başarıyla döner", async () => {
      prisma.user.findUnique.mockResolvedValue(buildUserRow());
      mail.send.mockRejectedValue(new Error("resend down"));

      await expect(service.requestPasswordReset("test@example.com")).resolves.toBeUndefined();
    });
  });

  describe("resetPassword", () => {
    it("geçersiz token için InvalidEmailTokenError fırlatır", async () => {
      prisma.emailToken.findUnique.mockResolvedValue(null);

      await expect(service.resetPassword("bozuk-token", "YeniSifre1")).rejects.toBeInstanceOf(
        InvalidEmailTokenError,
      );
    });

    it("süresi dolmuş token için InvalidEmailTokenError fırlatır", async () => {
      prisma.emailToken.findUnique.mockResolvedValue(
        buildEmailTokenRow({ expiresAt: new Date(Date.now() - 1000) }),
      );

      await expect(service.resetPassword("eski-token", "YeniSifre1")).rejects.toBeInstanceOf(
        InvalidEmailTokenError,
      );
    });

    it("kullanılmış token için InvalidEmailTokenError fırlatır", async () => {
      prisma.emailToken.findUnique.mockResolvedValue(buildEmailTokenRow({ usedAt: new Date() }));

      await expect(service.resetPassword("kullanilmis-token", "YeniSifre1")).rejects.toBeInstanceOf(
        InvalidEmailTokenError,
      );
    });

    it("geçerli tokenla şifreyi günceller, tokenı tüketir ve e-postayı doğrulanmış işaretler", async () => {
      prisma.emailToken.findUnique.mockResolvedValue(buildEmailTokenRow());

      await service.resetPassword("gecerli-token", "YeniSifre1");

      expect(prisma.emailToken.update).toHaveBeenCalledWith({
        where: { id: "token-1" },
        data: { usedAt: expect.any(Date) },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { passwordHash: expect.any(String), isEmailVerified: true },
      });
    });
  });

  describe("sendVerificationEmail", () => {
    it("zaten doğrulanmışsa EmailAlreadyVerifiedError fırlatır", async () => {
      prisma.user.findUnique.mockResolvedValue(buildUserRow({ isEmailVerified: true }));

      await expect(service.sendVerificationEmail("user-1")).rejects.toBeInstanceOf(
        EmailAlreadyVerifiedError,
      );
      expect(mail.send).not.toHaveBeenCalled();
    });

    it("doğrulanmamışsa token yaratır ve mail gönderir", async () => {
      prisma.user.findUnique.mockResolvedValue(buildUserRow({ isEmailVerified: false }));

      await service.sendVerificationEmail("user-1");

      expect(prisma.emailToken.create).toHaveBeenCalledTimes(1);
      expect(mail.send).toHaveBeenCalledTimes(1);
      expect(mail.send.mock.calls[0][0].text).toContain("/eposta-dogrula?token=");
    });
  });

  describe("verifyEmail", () => {
    it("geçersiz token için InvalidEmailTokenError fırlatır", async () => {
      prisma.emailToken.findUnique.mockResolvedValue(null);

      await expect(service.verifyEmail("bozuk-token")).rejects.toBeInstanceOf(InvalidEmailTokenError);
    });

    it("geçerli tokenla e-postayı doğrulanmış işaretler", async () => {
      prisma.emailToken.findUnique.mockResolvedValue(
        buildEmailTokenRow({ type: "EMAIL_VERIFICATION" }),
      );

      await service.verifyEmail("gecerli-token");

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { isEmailVerified: true },
      });
    });
  });
});
