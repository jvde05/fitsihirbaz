import { UsersService } from "./users.service";
import { PrismaService } from "../prisma/prisma.service";
import { CannotDeactivateSelfError, UserNotFoundError } from "./users.errors";

function buildUserRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "user-1",
    email: "test@example.com",
    passwordHash: "hash",
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

describe("UsersService", () => {
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock; findMany: jest.Mock; count: jest.Mock };
    $transaction: jest.Mock;
  };
  let service: UsersService;

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn(), count: jest.fn() },
      $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
    };
    service = new UsersService(prisma as unknown as PrismaService);
  });

  it("kullanıcı yoksa UserNotFoundError fırlatır", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.updateProfile("user-1", { firstName: "Yeni" })).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
  });

  it("temel profil alanlarını günceller", async () => {
    prisma.user.findUnique.mockResolvedValue(buildUserRow());
    prisma.user.update.mockResolvedValue(buildUserRow({ firstName: "Yeni", phone: "+905551234567" }));

    const result = await service.updateProfile("user-1", { firstName: "Yeni", phone: "+905551234567" });
    expect(result.firstName).toBe("Yeni");
    expect(result.phone).toBe("+905551234567");
  });

  describe("adminSetActive", () => {
    it("admin kendi hesabını pasife alamaz", async () => {
      await expect(service.adminSetActive("admin-1", "admin-1", false)).rejects.toBeInstanceOf(
        CannotDeactivateSelfError,
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("kullanıcı yoksa UserNotFoundError fırlatır", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.adminSetActive("admin-1", "user-1", false)).rejects.toBeInstanceOf(
        UserNotFoundError,
      );
    });

    it("başka bir kullanıcıyı pasife alabilir", async () => {
      prisma.user.findUnique.mockResolvedValue(buildUserRow());
      prisma.user.update.mockResolvedValue(buildUserRow({ isActive: false }));

      const result = await service.adminSetActive("admin-1", "user-1", false);
      expect(result.isActive).toBe(false);
    });
  });

  describe("adminList", () => {
    it("kullanıcıları toplam sayı ile birlikte döner", async () => {
      prisma.user.findMany.mockResolvedValue([buildUserRow()]);
      prisma.user.count.mockResolvedValue(1);

      const result = await service.adminList({ limit: 50, offset: 0 });
      expect(result.total).toBe(1);
      expect(result.items[0].email).toBe("test@example.com");
    });
  });
});
