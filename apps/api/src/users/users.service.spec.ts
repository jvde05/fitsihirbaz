import { UsersService } from "./users.service";
import { PrismaService } from "../prisma/prisma.service";
import { UserNotFoundError } from "./users.errors";

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
  let prisma: { user: { findUnique: jest.Mock; update: jest.Mock } };
  let service: UsersService;

  beforeEach(() => {
    prisma = { user: { findUnique: jest.fn(), update: jest.fn() } };
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
});
