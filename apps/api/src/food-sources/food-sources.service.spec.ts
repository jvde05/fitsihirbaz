import { FoodSourcesService } from "./food-sources.service";
import { PrismaService } from "../prisma/prisma.service";
import { FoodSourceInUseError, FoodSourceNotFoundError } from "./food-sources.errors";

function buildRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "src-1",
    name: "USDA FoodData Central",
    citation: "U.S. Department of Agriculture, FoodData Central, 2024",
    url: "https://fdc.nal.usda.gov",
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { foodItems: 0 },
    ...overrides,
  };
}

describe("FoodSourcesService", () => {
  let prisma: {
    foodSource: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let service: FoodSourcesService;

  beforeEach(() => {
    prisma = {
      foodSource: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new FoodSourcesService(prisma as unknown as PrismaService);
  });

  describe("list", () => {
    it("kaynakları isme göre sıralı ve besin sayısıyla döner", async () => {
      prisma.foodSource.findMany.mockResolvedValue([buildRow({ _count: { foodItems: 117 } })]);
      const result = await service.list();
      expect(result).toHaveLength(1);
      expect(result[0].foodItemCount).toBe(117);
      expect(prisma.foodSource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { name: "asc" } }),
      );
    });
  });

  describe("upsert", () => {
    it("id verilmezse yeni kaynak oluşturur", async () => {
      prisma.foodSource.create.mockResolvedValue(buildRow());
      const result = await service.upsert({
        name: "USDA FoodData Central",
        citation: "U.S. Department of Agriculture, FoodData Central, 2024",
      });
      expect(result.id).toBe("src-1");
      expect(prisma.foodSource.create).toHaveBeenCalled();
    });

    it("id verilir ama kayıt bulunamazsa hata fırlatır", async () => {
      prisma.foodSource.findUnique.mockResolvedValue(null);
      await expect(
        service.upsert({ id: "missing", name: "X", citation: "Y" }),
      ).rejects.toThrow(FoodSourceNotFoundError);
    });

    it("id verilir ve kayıt bulunursa günceller", async () => {
      prisma.foodSource.findUnique.mockResolvedValue(buildRow());
      prisma.foodSource.update.mockResolvedValue(buildRow({ name: "Güncellenmiş İsim" }));
      const result = await service.upsert({ id: "src-1", name: "Güncellenmiş İsim", citation: "Y" });
      expect(result.name).toBe("Güncellenmiş İsim");
    });
  });

  describe("delete", () => {
    it("kayıt bulunamazsa hata fırlatır", async () => {
      prisma.foodSource.findUnique.mockResolvedValue(null);
      await expect(service.delete("missing")).rejects.toThrow(FoodSourceNotFoundError);
    });

    it("kaynağa bağlı besin varsa silmeyi reddeder", async () => {
      prisma.foodSource.findUnique.mockResolvedValue(buildRow({ _count: { foodItems: 3 } }));
      await expect(service.delete("src-1")).rejects.toThrow(FoodSourceInUseError);
      expect(prisma.foodSource.delete).not.toHaveBeenCalled();
    });

    it("kaynağa bağlı besin yoksa siler", async () => {
      prisma.foodSource.findUnique.mockResolvedValue(buildRow({ _count: { foodItems: 0 } }));
      await service.delete("src-1");
      expect(prisma.foodSource.delete).toHaveBeenCalledWith({ where: { id: "src-1" } });
    });
  });
});
