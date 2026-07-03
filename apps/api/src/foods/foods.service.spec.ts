import { FoodsService } from "./foods.service";
import { PrismaService } from "../prisma/prisma.service";
import { FoodNotFoundError } from "./foods.errors";

function buildFoodItemRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "food-1",
    name: "Elma",
    nameEn: "Apple",
    category: "Meyveler",
    servingDescription: "1 orta boy",
    servingGramWeight: "182",
    sourceId: "source-1",
    isVerified: true,
    createdByUserId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    nutrientData: {
      id: "nutrient-1",
      foodItemId: "food-1",
      calories: "52",
      protein: "0.3",
      carbs: "13.8",
      fat: "0.2",
      fiber: "2.4",
      sugar: null,
      glycemicIndex: null,
      oracValue: null,
      vitamins: null,
      minerals: null,
      aminoAcids: null,
      fattyAcids: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    source: { id: "source-1", name: "USDA FoodData Central", citation: "...", url: null },
    ...overrides,
  };
}

describe("FoodsService", () => {
  let prisma: {
    foodItem: { findMany: jest.Mock; findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    foodSource: { findFirst: jest.Mock; create: jest.Mock };
    $queryRaw: jest.Mock;
  };
  let service: FoodsService;

  beforeEach(() => {
    prisma = {
      foodItem: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      foodSource: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      $queryRaw: jest.fn(),
    };
    service = new FoodsService(prisma as unknown as PrismaService);
  });

  describe("search", () => {
    it("besinleri eşleşen sayı ile birlikte döner", async () => {
      prisma.$queryRaw.mockResolvedValue([{ id: "food-1", total: BigInt(1) }]);
      prisma.foodItem.findMany.mockResolvedValue([buildFoodItemRow()]);

      const result = await service.search({ query: "elma", limit: 20, offset: 0 });

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({ name: "Elma", calories: 52, protein: 0.3 });
    });

    it("nutrientData'sı olmayan satırları filtreler", async () => {
      prisma.$queryRaw.mockResolvedValue([{ id: "food-1", total: BigInt(1) }]);
      prisma.foodItem.findMany.mockResolvedValue([buildFoodItemRow({ nutrientData: null })]);

      const result = await service.search({ query: "elma", limit: 20, offset: 0 });
      expect(result.items).toHaveLength(0);
    });

    it("hiç eşleşme yoksa boş sonuç döner ve foodItem.findMany çağrılmaz", async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      const result = await service.search({ query: "yokolan besin", limit: 20, offset: 0 });
      expect(result).toEqual({ items: [], total: 0 });
      expect(prisma.foodItem.findMany).not.toHaveBeenCalled();
    });

    it("trigram sırasını (rankedRows id sırası) korur", async () => {
      prisma.$queryRaw.mockResolvedValue([
        { id: "food-2", total: BigInt(2) },
        { id: "food-1", total: BigInt(2) },
      ]);
      // Prisma findMany sırayı garanti etmez; servis id sırasına göre yeniden sıralamalı.
      prisma.foodItem.findMany.mockResolvedValue([
        buildFoodItemRow({ id: "food-1", name: "Elma" }),
        buildFoodItemRow({ id: "food-2", name: "Elmas Salatası" }),
      ]);

      const result = await service.search({ query: "elma", limit: 20, offset: 0 });
      expect(result.items.map((item) => item.id)).toEqual(["food-2", "food-1"]);
    });
  });

  describe("getById", () => {
    it("besin bulunamazsa FoodNotFoundError fırlatır", async () => {
      prisma.foodItem.findUnique.mockResolvedValue(null);
      await expect(service.getById("yok")).rejects.toBeInstanceOf(FoodNotFoundError);
    });

    it("besin detayını döner", async () => {
      prisma.foodItem.findUnique.mockResolvedValue(buildFoodItemRow());
      const result = await service.getById("food-1");
      expect(result.sourceName).toBe("USDA FoodData Central");
      expect(result.fiber).toBe(2.4);
    });
  });

  describe("create", () => {
    it("kullanıcı girişi kaynağı yoksa oluşturur ve besini isVerified=false ile ekler", async () => {
      prisma.foodSource.findFirst.mockResolvedValue(null);
      prisma.foodSource.create.mockResolvedValue({ id: "user-source", name: "Kullanıcı Girişi" });
      prisma.foodItem.create.mockResolvedValue(
        buildFoodItemRow({ isVerified: false, sourceId: "user-source", source: { id: "user-source", name: "Kullanıcı Girişi" } }),
      );

      const result = await service.create(
        { name: "Elma", category: "Meyveler", calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2 },
        "user-1",
      );

      expect(prisma.foodSource.create).toHaveBeenCalledTimes(1);
      expect(result.isVerified).toBe(false);
      const createArgs = prisma.foodItem.create.mock.calls[0][0];
      expect(createArgs.data.createdByUserId).toBe("user-1");
      expect(createArgs.data.isVerified).toBe(false);
    });

    it("kullanıcı girişi kaynağı zaten varsa yeniden oluşturmaz", async () => {
      prisma.foodSource.findFirst.mockResolvedValue({ id: "user-source", name: "Kullanıcı Girişi" });
      prisma.foodItem.create.mockResolvedValue(buildFoodItemRow({ isVerified: false }));

      await service.create(
        { name: "Armut", category: "Meyveler", calories: 57, protein: 0.4, carbs: 15, fat: 0.1 },
        "user-1",
      );

      expect(prisma.foodSource.create).not.toHaveBeenCalled();
    });
  });

  describe("verify", () => {
    it("besin bulunamazsa FoodNotFoundError fırlatır", async () => {
      prisma.foodItem.findUnique.mockResolvedValue(null);
      await expect(service.verify("yok", true)).rejects.toBeInstanceOf(FoodNotFoundError);
      expect(prisma.foodItem.update).not.toHaveBeenCalled();
    });

    it("isVerified alanını günceller", async () => {
      prisma.foodItem.findUnique.mockResolvedValue(buildFoodItemRow({ isVerified: false }));
      prisma.foodItem.update.mockResolvedValue(buildFoodItemRow({ isVerified: true }));

      const result = await service.verify("food-1", true);
      expect(result.isVerified).toBe(true);
      expect(prisma.foodItem.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "food-1" }, data: { isVerified: true } }),
      );
    });
  });
});
