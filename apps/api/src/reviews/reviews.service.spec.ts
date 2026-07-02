import { ReviewsService } from "./reviews.service";
import { PrismaService } from "../prisma/prisma.service";
import { ClientProfileNotFoundError, NoPaidOrderError } from "./reviews.errors";

function buildReviewRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "review-1",
    clientId: "client-1",
    dietitianId: "dietitian-1",
    rating: 5,
    comment: "Harika bir deneyimdi",
    createdAt: new Date(),
    updatedAt: new Date(),
    client: { id: "client-1", userId: "client-user-1", user: { firstName: "Ali", lastName: "Veli" } },
    ...overrides,
  };
}

describe("ReviewsService", () => {
  let prisma: {
    clientProfile: { findUnique: jest.Mock };
    order: { findFirst: jest.Mock };
    review: { upsert: jest.Mock; findMany: jest.Mock; aggregate: jest.Mock };
    dietitianProfile: { update: jest.Mock };
  };
  let service: ReviewsService;

  beforeEach(() => {
    prisma = {
      clientProfile: { findUnique: jest.fn() },
      order: { findFirst: jest.fn() },
      review: { upsert: jest.fn(), findMany: jest.fn(), aggregate: jest.fn() },
      dietitianProfile: { update: jest.fn() },
    };
    service = new ReviewsService(prisma as unknown as PrismaService);
  });

  describe("create", () => {
    it("danışan profili yoksa ClientProfileNotFoundError fırlatır", async () => {
      prisma.clientProfile.findUnique.mockResolvedValue(null);
      await expect(
        service.create("client-user-1", { dietitianId: "dietitian-1", rating: 5 }),
      ).rejects.toBeInstanceOf(ClientProfileNotFoundError);
    });

    it("ödenmiş sipariş yoksa NoPaidOrderError fırlatır", async () => {
      prisma.clientProfile.findUnique.mockResolvedValue({ id: "client-1" });
      prisma.order.findFirst.mockResolvedValue(null);
      await expect(
        service.create("client-user-1", { dietitianId: "dietitian-1", rating: 5 }),
      ).rejects.toBeInstanceOf(NoPaidOrderError);
    });

    it("ödenmiş sipariş varsa yorumu upsert eder ve ortalama puanı yeniden hesaplar", async () => {
      prisma.clientProfile.findUnique.mockResolvedValue({ id: "client-1" });
      prisma.order.findFirst.mockResolvedValue({ id: "order-1", status: "PAID" });
      prisma.review.upsert.mockResolvedValue(buildReviewRow());
      prisma.review.aggregate.mockResolvedValue({ _avg: { rating: 4.5 } });

      const result = await service.create("client-user-1", {
        dietitianId: "dietitian-1",
        rating: 5,
        comment: "Harika bir deneyimdi",
      });

      expect(result.rating).toBe(5);
      expect(result.clientFirstName).toBe("Ali");
      expect(prisma.review.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clientId_dietitianId: { clientId: "client-1", dietitianId: "dietitian-1" } },
        }),
      );
      expect(prisma.dietitianProfile.update).toHaveBeenCalledWith({
        where: { id: "dietitian-1" },
        data: { averageRating: 4.5 },
      });
    });
  });

  describe("listForDietitian", () => {
    it("diyetisyenin yorumlarını danışan adıyla döner", async () => {
      prisma.review.findMany.mockResolvedValue([buildReviewRow()]);
      const result = await service.listForDietitian("dietitian-1");
      expect(result).toHaveLength(1);
      expect(result[0].clientFirstName).toBe("Ali");
    });
  });
});
