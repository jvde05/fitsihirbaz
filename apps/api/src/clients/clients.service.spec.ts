import { ClientsService } from "./clients.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  AlreadyLinkedError,
  ClientProfileNotFoundError,
  ClientUserNotFoundError,
  DietitianNotFoundError,
} from "./clients.errors";

function buildClientRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "client-1",
    userId: "user-1",
    birthDate: null,
    gender: null,
    heightCm: "165.5",
    goal: "WEIGHT_LOSS",
    activityLevel: "MODERATE",
    medicalNotes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: "user-1",
      email: "client@example.com",
      firstName: "Ali",
      lastName: "Veli",
      phone: null,
      avatarUrl: null,
      role: "CLIENT",
    },
    ...overrides,
  };
}

describe("ClientsService", () => {
  let prisma: {
    clientProfile: { findUnique: jest.Mock; update: jest.Mock };
    dietitianProfile: { findUnique: jest.Mock };
    user: { findUnique: jest.Mock };
    clientDietitianLink: { findFirst: jest.Mock; create: jest.Mock; findMany: jest.Mock };
  };
  let service: ClientsService;

  beforeEach(() => {
    prisma = {
      clientProfile: { findUnique: jest.fn(), update: jest.fn() },
      dietitianProfile: { findUnique: jest.fn() },
      user: { findUnique: jest.fn() },
      clientDietitianLink: { findFirst: jest.fn(), create: jest.fn(), findMany: jest.fn() },
    };
    service = new ClientsService(prisma as unknown as PrismaService);
  });

  describe("getMyProfile", () => {
    it("profil yoksa ClientProfileNotFoundError fırlatır", async () => {
      prisma.clientProfile.findUnique.mockResolvedValue(null);
      await expect(service.getMyProfile("user-1")).rejects.toBeInstanceOf(ClientProfileNotFoundError);
    });

    it("boy alanını sayıya çevirerek profili döner", async () => {
      prisma.clientProfile.findUnique.mockResolvedValue(buildClientRow());
      const result = await service.getMyProfile("user-1");
      expect(result.heightCm).toBe(165.5);
      expect(result.email).toBe("client@example.com");
    });
  });

  describe("getMyDietitians", () => {
    it("aktif bağlı diyetisyenleri döner", async () => {
      prisma.clientProfile.findUnique.mockResolvedValue({ id: "client-1" });
      prisma.clientDietitianLink.findMany.mockResolvedValue([
        {
          dietitian: {
            id: "dietitian-1",
            userId: "dyt-user-1",
            title: "Uzm. Dyt.",
            bio: null,
            specialties: [],
            yearsOfExperience: null,
            averageRating: null,
            verificationStatus: "PENDING",
            user: { firstName: "Ayşe", lastName: "Yılmaz", avatarUrl: null },
          },
        },
      ]);

      const result = await service.getMyDietitians("user-1");
      expect(result).toHaveLength(1);
      expect(result[0].firstName).toBe("Ayşe");
    });
  });

  describe("linkToDietitian", () => {
    it("diyetisyen profili yoksa DietitianNotFoundError fırlatır", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue(null);
      await expect(service.linkToDietitian("dyt-user-1", "client@example.com")).rejects.toBeInstanceOf(
        DietitianNotFoundError,
      );
    });

    it("danışan e-postası kayıtlı değilse ClientUserNotFoundError fırlatır", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue({ id: "dietitian-1" });
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.linkToDietitian("dyt-user-1", "yok@example.com")).rejects.toBeInstanceOf(
        ClientUserNotFoundError,
      );
    });

    it("e-posta bir DIETITIAN'a aitse ClientUserNotFoundError fırlatır", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue({ id: "dietitian-1" });
      prisma.user.findUnique.mockResolvedValue({ id: "u2", role: "DIETITIAN" });
      await expect(service.linkToDietitian("dyt-user-1", "baska-dyt@example.com")).rejects.toBeInstanceOf(
        ClientUserNotFoundError,
      );
    });

    it("zaten aktif bağlantı varsa AlreadyLinkedError fırlatır", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue({ id: "dietitian-1" });
      prisma.user.findUnique.mockResolvedValue({ id: "client-user-1", role: "CLIENT" });
      prisma.clientProfile.findUnique.mockResolvedValue({ id: "client-1" });
      prisma.clientDietitianLink.findFirst.mockResolvedValue({ id: "link-1" });

      await expect(service.linkToDietitian("dyt-user-1", "client@example.com")).rejects.toBeInstanceOf(
        AlreadyLinkedError,
      );
      expect(prisma.clientDietitianLink.create).not.toHaveBeenCalled();
    });

    it("geçerli durumda yeni bir ClientDietitianLink oluşturur", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue({ id: "dietitian-1" });
      prisma.user.findUnique.mockResolvedValue({ id: "client-user-1", role: "CLIENT" });
      prisma.clientProfile.findUnique.mockResolvedValue({ id: "client-1" });
      prisma.clientDietitianLink.findFirst.mockResolvedValue(null);
      prisma.clientDietitianLink.create.mockResolvedValue({});

      const result = await service.linkToDietitian("dyt-user-1", "client@example.com");
      expect(result).toEqual({ success: true });
      expect(prisma.clientDietitianLink.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            clientId: "client-1",
            dietitianId: "dietitian-1",
            status: "ACTIVE",
            source: "MANUAL_ADD",
          }),
        }),
      );
    });
  });
});
