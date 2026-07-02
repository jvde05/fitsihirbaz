import { ProgressService } from "./progress.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  ClientProfileNotFoundError,
  DietitianProfileNotFoundError,
  MissingClientIdError,
  ProgressAccessDeniedError,
} from "./progress.errors";

function buildLogRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "log-1",
    clientId: "client-1",
    logDate: new Date("2026-07-01"),
    weightKg: "70.5",
    bodyFatPercent: null,
    waistCm: null,
    hipCm: null,
    photoUrls: [],
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("ProgressService", () => {
  let prisma: {
    clientProfile: { findUnique: jest.Mock };
    dietitianProfile: { findUnique: jest.Mock };
    clientDietitianLink: { findFirst: jest.Mock };
    progressLog: { create: jest.Mock; findMany: jest.Mock };
  };
  let service: ProgressService;

  beforeEach(() => {
    prisma = {
      clientProfile: { findUnique: jest.fn() },
      dietitianProfile: { findUnique: jest.fn() },
      clientDietitianLink: { findFirst: jest.fn() },
      progressLog: { create: jest.fn(), findMany: jest.fn() },
    };
    service = new ProgressService(prisma as unknown as PrismaService);
  });

  describe("addLog", () => {
    it("danışan profili yoksa ClientProfileNotFoundError fırlatır", async () => {
      prisma.clientProfile.findUnique.mockResolvedValue(null);
      await expect(service.addLog("user-1", { logDate: "2026-07-01" })).rejects.toBeInstanceOf(
        ClientProfileNotFoundError,
      );
    });

    it("ölçüm kaydı oluşturur", async () => {
      prisma.clientProfile.findUnique.mockResolvedValue({ id: "client-1" });
      prisma.progressLog.create.mockResolvedValue(buildLogRow());

      const result = await service.addLog("user-1", { logDate: "2026-07-01", weightKg: 70.5 });
      expect(result.weightKg).toBe(70.5);
      expect(result.logDate).toBe("2026-07-01");
    });
  });

  describe("list", () => {
    it("CLIENT rolünde kendi kayıtlarını döner", async () => {
      prisma.clientProfile.findUnique.mockResolvedValue({ id: "client-1" });
      prisma.progressLog.findMany.mockResolvedValue([buildLogRow()]);

      const result = await service.list("user-1", "CLIENT");
      expect(result).toHaveLength(1);
      expect(prisma.progressLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { clientId: "client-1" } }),
      );
    });

    it("DIETITIAN rolünde clientId verilmezse MissingClientIdError fırlatır", async () => {
      await expect(service.list("dyt-user-1", "DIETITIAN")).rejects.toBeInstanceOf(MissingClientIdError);
    });

    it("DIETITIAN bağlı olmayan bir danışan için ProgressAccessDeniedError fırlatır", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue({ id: "dietitian-1" });
      prisma.clientDietitianLink.findFirst.mockResolvedValue(null);

      await expect(service.list("dyt-user-1", "DIETITIAN", "client-1")).rejects.toBeInstanceOf(
        ProgressAccessDeniedError,
      );
    });

    it("DIETITIAN bağlı danışanın kayıtlarını görebilir", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue({ id: "dietitian-1" });
      prisma.clientDietitianLink.findFirst.mockResolvedValue({ id: "link-1" });
      prisma.progressLog.findMany.mockResolvedValue([buildLogRow()]);

      const result = await service.list("dyt-user-1", "DIETITIAN", "client-1");
      expect(result).toHaveLength(1);
    });

    it("diyetisyen profili yoksa DietitianProfileNotFoundError fırlatır", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue(null);
      await expect(service.list("dyt-user-1", "DIETITIAN", "client-1")).rejects.toBeInstanceOf(
        DietitianProfileNotFoundError,
      );
    });
  });
});
