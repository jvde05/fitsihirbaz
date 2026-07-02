import { OrdersService } from "./orders.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  ClientProfileNotFoundError,
  DietitianProfileNotFoundError,
  PackageNotFoundError,
} from "./orders.errors";

function buildOrderRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "order-1",
    clientId: "client-1",
    packageId: "pkg-1",
    dietitianId: "dietitian-1",
    amount: "1000",
    commissionAmount: "150",
    dietitianPayoutAmount: "850",
    status: "PENDING",
    createdAt: new Date(),
    updatedAt: new Date(),
    package: { id: "pkg-1", title: "3 Aylık Takip", currency: "TRY" },
    client: { id: "client-1", userId: "client-user-1", user: { firstName: "Ali", lastName: "Veli" } },
    dietitian: { id: "dietitian-1", userId: "dyt-user-1", user: { firstName: "Ayşe", lastName: "Yılmaz" } },
    ...overrides,
  };
}

describe("OrdersService", () => {
  let prisma: {
    clientProfile: { findUnique: jest.Mock };
    dietitianProfile: { findUnique: jest.Mock };
    package: { findUnique: jest.Mock };
    order: { create: jest.Mock; findMany: jest.Mock };
  };
  let service: OrdersService;

  beforeEach(() => {
    prisma = {
      clientProfile: { findUnique: jest.fn() },
      dietitianProfile: { findUnique: jest.fn() },
      package: { findUnique: jest.fn() },
      order: { create: jest.fn(), findMany: jest.fn() },
    };
    service = new OrdersService(prisma as unknown as PrismaService);
  });

  describe("create", () => {
    it("danışan profili yoksa ClientProfileNotFoundError fırlatır", async () => {
      prisma.clientProfile.findUnique.mockResolvedValue(null);
      await expect(service.create("client-user-1", { packageId: "pkg-1" })).rejects.toBeInstanceOf(
        ClientProfileNotFoundError,
      );
    });

    it("aktif olmayan/olmayan paket için PackageNotFoundError fırlatır", async () => {
      prisma.clientProfile.findUnique.mockResolvedValue({ id: "client-1" });
      prisma.package.findUnique.mockResolvedValue(null);
      await expect(service.create("client-user-1", { packageId: "pkg-1" })).rejects.toBeInstanceOf(
        PackageNotFoundError,
      );
    });

    it("komisyonu doğru hesaplayarak PENDING sipariş oluşturur", async () => {
      prisma.clientProfile.findUnique.mockResolvedValue({ id: "client-1" });
      prisma.package.findUnique.mockResolvedValue({
        id: "pkg-1",
        price: "1000",
        isActive: true,
        dietitianId: "dietitian-1",
        dietitian: { commissionRate: "0.15" },
      });
      prisma.order.create.mockResolvedValue(buildOrderRow());

      const result = await service.create("client-user-1", { packageId: "pkg-1" });

      expect(result.status).toBe("PENDING");
      const createArgs = prisma.order.create.mock.calls[0][0];
      expect(createArgs.data.commissionAmount).toBe(150);
      expect(createArgs.data.dietitianPayoutAmount).toBe(850);
      expect(result.counterpartFirstName).toBe("Ayşe");
    });
  });

  describe("listForDietitian", () => {
    it("diyetisyen profili yoksa DietitianProfileNotFoundError fırlatır", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue(null);
      await expect(service.listForDietitian("dyt-user-1")).rejects.toBeInstanceOf(DietitianProfileNotFoundError);
    });

    it("diyetisyenin siparişlerini danışan adıyla döner", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue({ id: "dietitian-1" });
      prisma.order.findMany.mockResolvedValue([buildOrderRow()]);

      const result = await service.listForDietitian("dyt-user-1");
      expect(result).toHaveLength(1);
      expect(result[0].counterpartFirstName).toBe("Ali");
    });
  });
});
