import { DietPlansService } from "./diet-plans.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  ClientNotLinkedError,
  DietPlanAccessDeniedError,
  DietPlanFoodItemNotFoundError,
  DietPlanNotFoundError,
  EmptyDietPlanError,
} from "./diet-plans.errors";

function buildFoodItem(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "food-1",
    name: "Elma",
    servingGramWeight: "182",
    nutrientData: { calories: "52", protein: "0.3", carbs: "13.8", fat: "0.2" },
    ...overrides,
  };
}

function buildPlanHierarchy(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "plan-1",
    clientId: "client-1",
    dietitianId: "dietitian-1",
    title: "Test Planı",
    startDate: new Date("2026-01-01"),
    endDate: null,
    targetCalories: 1800,
    targetProteinG: null,
    targetCarbsG: null,
    targetFatG: null,
    status: "DRAFT",
    days: [
      {
        id: "day-1",
        dayNumber: 1,
        meals: [
          {
            id: "meal-1",
            mealType: "BREAKFAST",
            plannedTime: null,
            items: [
              {
                id: "item-1",
                foodItemId: "food-1",
                quantity: "100",
                unit: "GRAM",
                foodItem: buildFoodItem(),
              },
            ],
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe("DietPlansService", () => {
  let prisma: {
    dietitianProfile: { findUnique: jest.Mock };
    clientProfile: { findUnique: jest.Mock };
    clientDietitianLink: { findFirst: jest.Mock };
    dietPlan: { create: jest.Mock; findUnique: jest.Mock; findMany: jest.Mock };
    dietPlanDay: { create: jest.Mock; findUnique: jest.Mock };
    dietPlanMeal: { create: jest.Mock; findUnique: jest.Mock };
    dietPlanMealItem: { create: jest.Mock };
    foodItem: { findUnique: jest.Mock };
    $transaction: jest.Mock;
  };
  let service: DietPlansService;

  beforeEach(() => {
    prisma = {
      dietitianProfile: { findUnique: jest.fn() },
      clientProfile: { findUnique: jest.fn() },
      clientDietitianLink: { findFirst: jest.fn() },
      dietPlan: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
      dietPlanDay: { create: jest.fn(), findUnique: jest.fn() },
      dietPlanMeal: { create: jest.fn(), findUnique: jest.fn() },
      dietPlanMealItem: { create: jest.fn() },
      foodItem: { findUnique: jest.fn() },
      $transaction: jest.fn(),
    };
    service = new DietPlansService(prisma as unknown as PrismaService);
  });

  describe("create", () => {
    it("danışan bu diyetisyene bağlı değilse ClientNotLinkedError fırlatır", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue({ id: "dietitian-1" });
      prisma.clientDietitianLink.findFirst.mockResolvedValue(null);

      await expect(
        service.create("dyt-user-1", { clientId: "client-1", title: "Plan", startDate: "2026-01-01" }),
      ).rejects.toBeInstanceOf(ClientNotLinkedError);
      expect(prisma.dietPlan.create).not.toHaveBeenCalled();
    });

    it("bağlı danışan için plan oluşturur (DRAFT durumunda)", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue({ id: "dietitian-1" });
      prisma.clientDietitianLink.findFirst.mockResolvedValue({ id: "link-1" });
      prisma.dietPlan.create.mockResolvedValue({
        id: "plan-1",
        clientId: "client-1",
        dietitianId: "dietitian-1",
        title: "Plan",
        startDate: new Date("2026-01-01"),
        endDate: null,
        targetCalories: null,
        targetProteinG: null,
        targetCarbsG: null,
        targetFatG: null,
        status: "DRAFT",
      });

      const result = await service.create("dyt-user-1", {
        clientId: "client-1",
        title: "Plan",
        startDate: "2026-01-01",
      });
      expect(result.status).toBe("DRAFT");
      const createArgs = prisma.dietPlan.create.mock.calls[0][0];
      expect(createArgs.data.status).toBe("DRAFT");
    });
  });

  describe("addMealItem", () => {
    it("besin bulunamazsa DietPlanFoodItemNotFoundError fırlatır", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue({ id: "dietitian-1" });
      prisma.dietPlanMeal.findUnique.mockResolvedValue({
        id: "meal-1",
        dietPlanDay: { dietPlan: { dietitianId: "dietitian-1" } },
      });
      prisma.foodItem.findUnique.mockResolvedValue(null);

      await expect(
        service.addMealItem("dyt-user-1", {
          dietPlanMealId: "meal-1",
          foodItemId: "yok",
          quantity: 100,
          unit: "GRAM",
        }),
      ).rejects.toBeInstanceOf(DietPlanFoodItemNotFoundError);
    });

    it("başka bir diyetisyenin planına erişimi reddeder", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue({ id: "dietitian-1" });
      prisma.dietPlanMeal.findUnique.mockResolvedValue({
        id: "meal-1",
        dietPlanDay: { dietPlan: { dietitianId: "baska-diyetisyen" } },
      });

      await expect(
        service.addMealItem("dyt-user-1", {
          dietPlanMealId: "meal-1",
          foodItemId: "food-1",
          quantity: 100,
          unit: "GRAM",
        }),
      ).rejects.toBeInstanceOf(DietPlanAccessDeniedError);
    });

    it("geçerli besin için kalori/makro hesaplayarak öğe ekler", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue({ id: "dietitian-1" });
      prisma.dietPlanMeal.findUnique.mockResolvedValue({
        id: "meal-1",
        dietPlanDay: { dietPlan: { dietitianId: "dietitian-1" } },
      });
      prisma.foodItem.findUnique.mockResolvedValue(buildFoodItem());
      prisma.dietPlanMealItem.create.mockResolvedValue({ id: "item-1", quantity: "100", unit: "GRAM" });

      const result = await service.addMealItem("dyt-user-1", {
        dietPlanMealId: "meal-1",
        foodItemId: "food-1",
        quantity: 100,
        unit: "GRAM",
      });
      expect(result).toMatchObject({ foodName: "Elma", calories: 52, protein: 0.3 });
    });
  });

  describe("getById", () => {
    it("plan yoksa DietPlanNotFoundError fırlatır", async () => {
      prisma.dietPlan.findUnique.mockResolvedValue(null);
      await expect(service.getById("user-1", "DIETITIAN", "yok")).rejects.toBeInstanceOf(DietPlanNotFoundError);
    });

    it("sahibi olmayan danışanın erişimini reddeder", async () => {
      prisma.dietPlan.findUnique.mockResolvedValue(buildPlanHierarchy());
      prisma.clientProfile.findUnique.mockResolvedValue({ id: "baska-danisan" });

      await expect(service.getById("client-user-1", "CLIENT", "plan-1")).rejects.toBeInstanceOf(
        DietPlanAccessDeniedError,
      );
    });

    it("sahibi diyetisyen için gün/öğün/besin hiyerarşisi ve toplamları döner", async () => {
      prisma.dietPlan.findUnique.mockResolvedValue(buildPlanHierarchy());
      prisma.dietitianProfile.findUnique.mockResolvedValue({ id: "dietitian-1" });

      const result = await service.getById("dyt-user-1", "DIETITIAN", "plan-1");
      expect(result.days).toHaveLength(1);
      expect(result.days[0].meals[0].items[0]).toMatchObject({ foodName: "Elma", calories: 52 });
      expect(result.totals.calories).toBe(52);
    });
  });

  describe("list", () => {
    it("CLIENT rolünde kendi planlarını döner", async () => {
      prisma.clientProfile.findUnique.mockResolvedValue({ id: "client-1" });
      prisma.dietPlan.findMany.mockResolvedValue([buildPlanHierarchy()]);

      const result = await service.list("client-user-1", "CLIENT");
      expect(result).toHaveLength(1);
      expect(prisma.dietPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { clientId: "client-1" } }),
      );
    });

    it("DIETITIAN rolünde clientId verilmezse MissingClientIdError fırlatır", async () => {
      await expect(service.list("dyt-user-1", "DIETITIAN")).rejects.toThrow();
    });

    it("DIETITIAN rolünde yalnızca kendi oluşturduğu planları döner", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue({ id: "dietitian-1" });
      prisma.dietPlan.findMany.mockResolvedValue([buildPlanHierarchy()]);

      const result = await service.list("dyt-user-1", "DIETITIAN", "client-1");
      expect(result).toHaveLength(1);
      expect(prisma.dietPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { clientId: "client-1", dietitianId: "dietitian-1" } }),
      );
    });
  });

  describe("duplicateForNewCalorieTarget", () => {
    it("boş bir plan için EmptyDietPlanError fırlatır", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue({ id: "dietitian-1" });
      prisma.dietPlan.findUnique.mockResolvedValue(buildPlanHierarchy({ days: [] }));

      await expect(
        service.duplicateForNewCalorieTarget("dyt-user-1", { dietPlanId: "plan-1", newTargetCalories: 1500 }),
      ).rejects.toBeInstanceOf(EmptyDietPlanError);
    });

    it("kaloriye göre porsiyonları ölçekleyip yeni bir plan oluşturur", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue({ id: "dietitian-1" });
      prisma.dietPlan.findUnique
        .mockResolvedValueOnce(buildPlanHierarchy())
        .mockResolvedValueOnce(buildPlanHierarchy({ id: "plan-2", targetCalories: 104 }));

      const txMock = {
        dietPlan: { create: jest.fn().mockResolvedValue({ id: "plan-2" }) },
        dietPlanDay: { create: jest.fn().mockResolvedValue({ id: "day-2" }) },
        dietPlanMeal: { create: jest.fn().mockResolvedValue({ id: "meal-2" }) },
        dietPlanMealItem: { create: jest.fn().mockResolvedValue({ id: "item-2" }) },
      };
      prisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
        callback(txMock),
      );

      const result = await service.duplicateForNewCalorieTarget("dyt-user-1", {
        dietPlanId: "plan-1",
        newTargetCalories: 104,
      });

      // orijinal toplam 52 kcal idi, hedef 104 kcal -> 2x ölçek -> miktar 200g olmalı
      expect(txMock.dietPlanMealItem.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ quantity: 200 }) }),
      );
      expect(result.id).toBe("plan-2");
    });
  });
});
