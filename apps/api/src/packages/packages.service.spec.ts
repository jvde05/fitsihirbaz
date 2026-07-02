import { PackagesService } from "./packages.service";
import { PrismaService } from "../prisma/prisma.service";
import { DietitianProfileNotFoundError, PackageAccessDeniedError, PackageNotFoundError } from "./packages.errors";

function buildPackageRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "package-1",
    dietitianId: "dietitian-1",
    title: "3 Aylık Online Takip",
    description: null,
    durationDays: 90,
    sessionCount: null,
    price: "1500",
    currency: "TRY",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("PackagesService", () => {
  let prisma: {
    dietitianProfile: { findUnique: jest.Mock };
    package: { create: jest.Mock; update: jest.Mock; findUnique: jest.Mock; findMany: jest.Mock; count: jest.Mock };
    $transaction: jest.Mock;
  };
  let service: PackagesService;

  beforeEach(() => {
    prisma = {
      dietitianProfile: { findUnique: jest.fn() },
      package: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
    };
    service = new PackagesService(prisma as unknown as PrismaService);
  });

  describe("create", () => {
    it("diyetisyen profili yoksa DietitianProfileNotFoundError fırlatır", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue(null);
      await expect(
        service.create("dyt-user-1", { title: "Paket", durationDays: 30, price: 500, currency: "TRY" }),
      ).rejects.toBeInstanceOf(DietitianProfileNotFoundError);
    });

    it("fiyatı sayıya çevirerek paket oluşturur", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue({ id: "dietitian-1" });
      prisma.package.create.mockResolvedValue(buildPackageRow());

      const result = await service.create("dyt-user-1", {
        title: "3 Aylık Online Takip",
        durationDays: 90,
        price: 1500,
        currency: "TRY",
      });
      expect(result.price).toBe(1500);
      expect(typeof result.price).toBe("number");
    });
  });

  describe("update", () => {
    it("paket başka bir diyetisyene aitse PackageAccessDeniedError fırlatır", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue({ id: "dietitian-1" });
      prisma.package.findUnique.mockResolvedValue(buildPackageRow({ dietitianId: "baska-dietitian" }));

      await expect(
        service.update("dyt-user-1", { id: "package-1", isActive: false }),
      ).rejects.toBeInstanceOf(PackageAccessDeniedError);
      expect(prisma.package.update).not.toHaveBeenCalled();
    });

    it("paket yoksa PackageNotFoundError fırlatır", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue({ id: "dietitian-1" });
      prisma.package.findUnique.mockResolvedValue(null);

      await expect(service.update("dyt-user-1", { id: "yok", isActive: false })).rejects.toBeInstanceOf(
        PackageNotFoundError,
      );
    });

    it("sahibi olduğu paketi günceller", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue({ id: "dietitian-1" });
      prisma.package.findUnique.mockResolvedValue(buildPackageRow());
      prisma.package.update.mockResolvedValue(buildPackageRow({ isActive: false }));

      const result = await service.update("dyt-user-1", { id: "package-1", isActive: false });
      expect(result.isActive).toBe(false);
    });
  });

  describe("browse", () => {
    it("yalnızca aktif paketleri döner", async () => {
      prisma.package.findMany.mockResolvedValue([
        {
          ...buildPackageRow(),
          dietitian: {
            title: "Uzm. Dyt.",
            user: { firstName: "Ayşe", lastName: "Yılmaz", avatarUrl: null },
          },
        },
      ]);
      prisma.package.count.mockResolvedValue(1);

      const result = await service.browse({ limit: 20, offset: 0 });
      expect(result.total).toBe(1);
      expect(result.items[0]).toMatchObject({ dietitianFirstName: "Ayşe", price: 1500 });
      const whereArg = prisma.package.findMany.mock.calls[0][0].where;
      expect(whereArg.isActive).toBe(true);
    });
  });
});
