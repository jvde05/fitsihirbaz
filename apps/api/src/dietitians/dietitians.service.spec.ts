import { DietitiansService } from "./dietitians.service";
import { PrismaService } from "../prisma/prisma.service";
import { DietitianProfileNotFoundError } from "./dietitians.errors";

function buildDietitianRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "dietitian-1",
    userId: "user-1",
    title: "Uzm. Dyt.",
    bio: "Spor beslenmesi uzmanı",
    specialties: ["Spor Beslenmesi"],
    yearsOfExperience: 5,
    licenseNumber: "12345",
    certificationUrls: [],
    verificationStatus: "PENDING",
    commissionRate: "0.15",
    averageRating: null,
    payoutAccountInfo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: "user-1",
      email: "dyt@example.com",
      firstName: "Ayşe",
      lastName: "Yılmaz",
      phone: null,
      avatarUrl: null,
      role: "DIETITIAN",
    },
    ...overrides,
  };
}

describe("DietitiansService", () => {
  let prisma: {
    dietitianProfile: { findUnique: jest.Mock; update: jest.Mock; findMany: jest.Mock; count: jest.Mock };
    clientDietitianLink: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let service: DietitiansService;

  beforeEach(() => {
    prisma = {
      dietitianProfile: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      clientDietitianLink: { findMany: jest.fn() },
      $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
    };
    service = new DietitiansService(prisma as unknown as PrismaService);
  });

  describe("getMyProfile", () => {
    it("profil yoksa DietitianProfileNotFoundError fırlatır", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue(null);
      await expect(service.getMyProfile("user-1")).rejects.toBeInstanceOf(DietitianProfileNotFoundError);
    });

    it("profili döner", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue(buildDietitianRow());
      const result = await service.getMyProfile("user-1");
      expect(result.email).toBe("dyt@example.com");
      expect(result.specialties).toEqual(["Spor Beslenmesi"]);
    });
  });

  describe("search", () => {
    it("sonuçları toplam sayı ile birlikte döner", async () => {
      prisma.dietitianProfile.findMany.mockResolvedValue([buildDietitianRow({ averageRating: "4.5" })]);
      prisma.dietitianProfile.count.mockResolvedValue(1);

      const result = await service.search({ limit: 20, offset: 0 });
      expect(result.total).toBe(1);
      expect(result.items[0].averageRating).toBe(4.5);
    });
  });

  describe("getPublicProfile", () => {
    it("profil yoksa DietitianProfileNotFoundError fırlatır", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue(null);
      await expect(service.getPublicProfile("dietitian-1")).rejects.toBeInstanceOf(
        DietitianProfileNotFoundError,
      );
    });

    it("hassas alanlar olmadan public profili döner", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue(buildDietitianRow());
      const result = await service.getPublicProfile("dietitian-1");
      expect(result).not.toHaveProperty("email");
      expect(result.title).toBe("Uzm. Dyt.");
    });
  });

  describe("getMyClients", () => {
    it("diyetisyen profili yoksa hata fırlatır", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue(null);
      await expect(service.getMyClients("user-1")).rejects.toBeInstanceOf(DietitianProfileNotFoundError);
    });

    it("aktif bağlı danışanları döner", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue(buildDietitianRow());
      prisma.clientDietitianLink.findMany.mockResolvedValue([
        {
          status: "ACTIVE",
          source: "MANUAL_ADD",
          startedAt: new Date("2026-01-01"),
          client: {
            id: "client-1",
            userId: "client-user-1",
            user: {
              id: "client-user-1",
              email: "client@example.com",
              firstName: "Ali",
              lastName: "Veli",
              avatarUrl: null,
            },
          },
        },
      ]);

      const result = await service.getMyClients("user-1");
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ firstName: "Ali", linkSource: "MANUAL_ADD" });
    });
  });

  describe("adminVerify", () => {
    it("diyetisyen yoksa DietitianProfileNotFoundError fırlatır", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue(null);
      await expect(service.adminVerify("dietitian-1", "VERIFIED")).rejects.toBeInstanceOf(
        DietitianProfileNotFoundError,
      );
    });

    it("verificationStatus alanını günceller", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue(buildDietitianRow());
      prisma.dietitianProfile.update.mockResolvedValue(buildDietitianRow({ verificationStatus: "VERIFIED" }));

      const result = await service.adminVerify("dietitian-1", "VERIFIED");
      expect(result.verificationStatus).toBe("VERIFIED");
    });
  });
});
