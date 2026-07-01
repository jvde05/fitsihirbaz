import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { TokenService } from "./token.service";
import {
  AccountInactiveError,
  EmailAlreadyExistsError,
  InvalidCredentialsError,
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

describe("AuthService", () => {
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock } };
  let tokens: { issuePair: jest.Mock; verifyRefreshToken: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    tokens = {
      issuePair: jest.fn().mockReturnValue({ accessToken: "access", refreshToken: "refresh" }),
      verifyRefreshToken: jest.fn(),
    };
    service = new AuthService(prisma as unknown as PrismaService, tokens as unknown as TokenService);
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
});
