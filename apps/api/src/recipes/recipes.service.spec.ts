import { RecipesService } from "./recipes.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  RecipeAccessDeniedError,
  RecipeIngredientFoodItemNotFoundError,
  RecipeNotFoundError,
} from "./recipes.errors";

function buildFoodItem(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "food-1",
    name: "Yulaf",
    servingGramWeight: null,
    nutrientData: { calories: "389", protein: "16.9", carbs: "66.3", fat: "6.9" },
    ...overrides,
  };
}

function buildRecipeRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "recipe-1",
    name: "Yulaf Lapası",
    description: null,
    servings: 2,
    instructions: null,
    isPublic: false,
    createdByUserId: "dyt-user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    ingredients: [
      { id: "ing-1", recipeId: "recipe-1", foodItemId: "food-1", quantity: "200", unit: "GRAM", foodItem: buildFoodItem() },
    ],
    ...overrides,
  };
}

describe("RecipesService", () => {
  let prisma: {
    recipe: { create: jest.Mock; update: jest.Mock; findUnique: jest.Mock; findMany: jest.Mock };
    recipeIngredient: { deleteMany: jest.Mock };
    foodItem: { count: jest.Mock };
    $transaction: jest.Mock;
  };
  let service: RecipesService;

  beforeEach(() => {
    prisma = {
      recipe: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
      recipeIngredient: { deleteMany: jest.fn() },
      foodItem: { count: jest.fn() },
      $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(prisma)),
    };
    service = new RecipesService(prisma as unknown as PrismaService);
  });

  describe("create", () => {
    it("malzemelerden biri bulunamazsa RecipeIngredientFoodItemNotFoundError fırlatır", async () => {
      prisma.foodItem.count.mockResolvedValue(0);

      await expect(
        service.create("dyt-user-1", {
          name: "Yulaf Lapası",
          servings: 2,
          isPublic: false,
          ingredients: [{ foodItemId: "food-1", quantity: 200, unit: "GRAM" }],
        }),
      ).rejects.toBeInstanceOf(RecipeIngredientFoodItemNotFoundError);
      expect(prisma.recipe.create).not.toHaveBeenCalled();
    });

    it("porsiyon başı besin değerini hesaplayarak tarifi oluşturur", async () => {
      prisma.foodItem.count.mockResolvedValue(1);
      prisma.recipe.create.mockResolvedValue(buildRecipeRow());

      const result = await service.create("dyt-user-1", {
        name: "Yulaf Lapası",
        servings: 2,
        isPublic: false,
        ingredients: [{ foodItemId: "food-1", quantity: 200, unit: "GRAM" }],
      });

      // 200g yulaf: 778 kcal toplam / 2 porsiyon = 389 kcal/porsiyon
      expect(result.totalsPerServing.calories).toBe(389);
      expect(result.totals.calories).toBe(778);
      expect(result.ingredients).toHaveLength(1);
      expect(result.ingredients[0].foodName).toBe("Yulaf");
    });
  });

  describe("update", () => {
    it("tarif bulunamazsa RecipeNotFoundError fırlatır", async () => {
      prisma.recipe.findUnique.mockResolvedValue(null);
      await expect(
        service.update("dyt-user-1", "DIETITIAN", {
          id: "yok",
          name: "X",
          servings: 1,
          isPublic: false,
          ingredients: [{ foodItemId: "food-1", quantity: 100, unit: "GRAM" }],
        }),
      ).rejects.toBeInstanceOf(RecipeNotFoundError);
    });

    it("başkasının tarifini güncellemeye çalışan diyetisyeni reddeder", async () => {
      prisma.recipe.findUnique.mockResolvedValue(buildRecipeRow({ createdByUserId: "baska-dyt" }));

      await expect(
        service.update("dyt-user-1", "DIETITIAN", {
          id: "recipe-1",
          name: "X",
          servings: 1,
          isPublic: false,
          ingredients: [{ foodItemId: "food-1", quantity: 100, unit: "GRAM" }],
        }),
      ).rejects.toBeInstanceOf(RecipeAccessDeniedError);
    });

    it("admin başkasının tarifini güncelleyebilir", async () => {
      prisma.recipe.findUnique.mockResolvedValue(buildRecipeRow({ createdByUserId: "baska-dyt" }));
      prisma.foodItem.count.mockResolvedValue(1);
      prisma.recipe.update.mockResolvedValue(buildRecipeRow({ name: "Güncel" }));

      const result = await service.update("admin-1", "ADMIN", {
        id: "recipe-1",
        name: "Güncel",
        servings: 2,
        isPublic: false,
        ingredients: [{ foodItemId: "food-1", quantity: 200, unit: "GRAM" }],
      });
      expect(result.name).toBe("Güncel");
      expect(prisma.recipeIngredient.deleteMany).toHaveBeenCalledWith({ where: { recipeId: "recipe-1" } });
    });
  });

  describe("getById", () => {
    it("özel tarifi sahibi olmayan kullanıcıya göstermez", async () => {
      prisma.recipe.findUnique.mockResolvedValue(buildRecipeRow({ isPublic: false, createdByUserId: "baska-dyt" }));

      await expect(service.getById("dyt-user-1", "DIETITIAN", "recipe-1")).rejects.toBeInstanceOf(
        RecipeAccessDeniedError,
      );
    });

    it("herkese açık tarifi herkes görebilir", async () => {
      prisma.recipe.findUnique.mockResolvedValue(buildRecipeRow({ isPublic: true, createdByUserId: "baska-dyt" }));

      const result = await service.getById("dyt-user-1", "DIETITIAN", "recipe-1");
      expect(result.id).toBe("recipe-1");
    });
  });

  describe("list", () => {
    it("mineOnly=true iken sadece kendi tariflerini döner", async () => {
      prisma.recipe.findMany.mockResolvedValue([buildRecipeRow()]);

      await service.list("dyt-user-1", "DIETITIAN", true);
      expect(prisma.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { createdByUserId: "dyt-user-1" } }),
      );
    });

    it("mineOnly=false iken herkese açık ve kendi tariflerini döner", async () => {
      prisma.recipe.findMany.mockResolvedValue([]);

      await service.list("dyt-user-1", "DIETITIAN", false);
      expect(prisma.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { OR: [{ isPublic: true }, { createdByUserId: "dyt-user-1" }] } }),
      );
    });
  });
});
