import { Injectable } from "@nestjs/common";
import type {
  AddDietPlanDayInput,
  AddDietPlanMealInput,
  AddDietPlanMealItemInput,
  CreateDietPlanInput,
  DietPlanDayView,
  DietPlanDetail,
  DietPlanMealItemView,
  DietPlanMealView,
  DietPlanSummary,
  DuplicateForNewCalorieTargetInput,
  Role,
} from "@fit-sihirbaz/shared";
import { PrismaService } from "../prisma/prisma.service";
import {
  ClientNotLinkedError,
  DietPlanAccessDeniedError,
  DietPlanDayNotFoundError,
  DietPlanFoodItemNotFoundError,
  DietPlanMealNotFoundError,
  DietPlanNotFoundError,
  DietPlanRecipeNotFoundError,
  DietitianProfileNotFoundError,
  EmptyDietPlanError,
  MissingClientIdError,
} from "./diet-plans.errors";
import { buildMealItemView, type DietPlanWithHierarchy, toDietPlanDetail, toDietPlanSummary } from "./diet-plans.mapper";

const RECIPE_INCLUDE = {
  ingredients: { include: { foodItem: { include: { nutrientData: true } } } },
};

const MEAL_ITEM_INCLUDE = {
  foodItem: { include: { nutrientData: true } },
  recipe: { include: RECIPE_INCLUDE },
};

const PLAN_HIERARCHY_INCLUDE = {
  days: {
    orderBy: { dayNumber: "asc" as const },
    include: {
      meals: {
        orderBy: { createdAt: "asc" as const },
        include: {
          items: {
            include: MEAL_ITEM_INCLUDE,
          },
        },
      },
    },
  },
};

@Injectable()
export class DietPlansService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dietitianUserId: string, input: CreateDietPlanInput): Promise<DietPlanSummary> {
    const dietitianProfile = await this.getOwnDietitianProfile(dietitianUserId);
    await this.assertClientLinked(dietitianProfile.id, input.clientId);

    const plan = await this.prisma.dietPlan.create({
      data: {
        clientId: input.clientId,
        dietitianId: dietitianProfile.id,
        title: input.title,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        targetCalories: input.targetCalories,
        targetProteinG: input.targetProteinG,
        targetCarbsG: input.targetCarbsG,
        targetFatG: input.targetFatG,
        status: "DRAFT",
      },
    });

    return toDietPlanSummary(plan);
  }

  async addDay(dietitianUserId: string, input: AddDietPlanDayInput): Promise<DietPlanDayView> {
    const dietitianProfile = await this.getOwnDietitianProfile(dietitianUserId);
    const plan = await this.prisma.dietPlan.findUnique({ where: { id: input.dietPlanId } });
    if (!plan) {
      throw new DietPlanNotFoundError();
    }
    if (plan.dietitianId !== dietitianProfile.id) {
      throw new DietPlanAccessDeniedError();
    }

    const day = await this.prisma.dietPlanDay.create({
      data: { dietPlanId: input.dietPlanId, dayNumber: input.dayNumber },
    });

    return { id: day.id, dayNumber: day.dayNumber, meals: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0 } };
  }

  async addMeal(dietitianUserId: string, input: AddDietPlanMealInput): Promise<DietPlanMealView> {
    const dietitianProfile = await this.getOwnDietitianProfile(dietitianUserId);
    const day = await this.prisma.dietPlanDay.findUnique({
      where: { id: input.dietPlanDayId },
      include: { dietPlan: true },
    });
    if (!day) {
      throw new DietPlanDayNotFoundError();
    }
    if (day.dietPlan.dietitianId !== dietitianProfile.id) {
      throw new DietPlanAccessDeniedError();
    }

    const meal = await this.prisma.dietPlanMeal.create({
      data: {
        dietPlanDayId: input.dietPlanDayId,
        mealType: input.mealType,
        plannedTime: input.plannedTime ? new Date(`1970-01-01T${input.plannedTime}:00Z`) : undefined,
      },
    });

    return {
      id: meal.id,
      mealType: meal.mealType,
      plannedTime: input.plannedTime ?? null,
      items: [],
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    };
  }

  async addMealItem(dietitianUserId: string, input: AddDietPlanMealItemInput): Promise<DietPlanMealItemView> {
    const dietitianProfile = await this.getOwnDietitianProfile(dietitianUserId);
    const meal = await this.prisma.dietPlanMeal.findUnique({
      where: { id: input.dietPlanMealId },
      include: { dietPlanDay: { include: { dietPlan: true } } },
    });
    if (!meal) {
      throw new DietPlanMealNotFoundError();
    }
    if (meal.dietPlanDay.dietPlan.dietitianId !== dietitianProfile.id) {
      throw new DietPlanAccessDeniedError();
    }

    if (input.recipeId) {
      const recipe = await this.prisma.recipe.findUnique({
        where: { id: input.recipeId },
        include: RECIPE_INCLUDE,
      });
      if (!recipe) {
        throw new DietPlanRecipeNotFoundError();
      }
      const item = await this.prisma.dietPlanMealItem.create({
        data: {
          dietPlanMealId: input.dietPlanMealId,
          recipeId: input.recipeId,
          quantity: input.quantity,
          unit: input.unit,
        },
      });
      return buildMealItemView({ ...item, foodItem: null, recipe });
    }

    const foodItem = await this.prisma.foodItem.findUnique({
      where: { id: input.foodItemId },
      include: { nutrientData: true },
    });
    if (!foodItem || !foodItem.nutrientData) {
      throw new DietPlanFoodItemNotFoundError();
    }

    const item = await this.prisma.dietPlanMealItem.create({
      data: {
        dietPlanMealId: input.dietPlanMealId,
        foodItemId: input.foodItemId,
        quantity: input.quantity,
        unit: input.unit,
      },
    });

    return buildMealItemView({ ...item, foodItem, recipe: null });
  }

  async getById(userId: string, role: Role, dietPlanId: string): Promise<DietPlanDetail> {
    const plan = await this.loadPlanHierarchy(dietPlanId);
    if (!plan) {
      throw new DietPlanNotFoundError();
    }
    await this.assertCanViewPlan(userId, role, plan);
    return toDietPlanDetail(plan);
  }

  async list(userId: string, role: Role, clientId?: string): Promise<DietPlanSummary[]> {
    if (role === "CLIENT") {
      const profile = await this.prisma.clientProfile.findUnique({ where: { userId } });
      if (!profile) {
        throw new DietPlanAccessDeniedError();
      }
      const plans = await this.prisma.dietPlan.findMany({
        where: { clientId: profile.id },
        orderBy: { createdAt: "desc" },
      });
      return plans.map(toDietPlanSummary);
    }

    if (role === "DIETITIAN") {
      if (!clientId) {
        throw new MissingClientIdError();
      }
      const profile = await this.getOwnDietitianProfile(userId);
      const plans = await this.prisma.dietPlan.findMany({
        where: { clientId, dietitianId: profile.id },
        orderBy: { createdAt: "desc" },
      });
      return plans.map(toDietPlanSummary);
    }

    throw new DietPlanAccessDeniedError();
  }

  async duplicateForNewCalorieTarget(
    dietitianUserId: string,
    input: DuplicateForNewCalorieTargetInput,
  ): Promise<DietPlanDetail> {
    const dietitianProfile = await this.getOwnDietitianProfile(dietitianUserId);
    const original = await this.loadPlanHierarchy(input.dietPlanId);
    if (!original) {
      throw new DietPlanNotFoundError();
    }
    if (original.dietitianId !== dietitianProfile.id) {
      throw new DietPlanAccessDeniedError();
    }

    const originalDetail = toDietPlanDetail(original);
    if (originalDetail.totals.calories <= 0) {
      throw new EmptyDietPlanError();
    }
    const scaleFactor = input.newTargetCalories / originalDetail.totals.calories;

    const newPlanId = await this.prisma.$transaction(async (tx) => {
      const newPlan = await tx.dietPlan.create({
        data: {
          clientId: original.clientId,
          dietitianId: original.dietitianId,
          title: input.newTitle ?? `${original.title} (${input.newTargetCalories} kcal)`,
          startDate: original.startDate,
          endDate: original.endDate,
          targetCalories: input.newTargetCalories,
          targetProteinG: original.targetProteinG ? Number(original.targetProteinG) * scaleFactor : undefined,
          targetCarbsG: original.targetCarbsG ? Number(original.targetCarbsG) * scaleFactor : undefined,
          targetFatG: original.targetFatG ? Number(original.targetFatG) * scaleFactor : undefined,
          status: "DRAFT",
        },
      });

      for (const day of original.days) {
        const newDay = await tx.dietPlanDay.create({
          data: { dietPlanId: newPlan.id, dayNumber: day.dayNumber },
        });
        for (const meal of day.meals) {
          const newMeal = await tx.dietPlanMeal.create({
            data: {
              dietPlanDayId: newDay.id,
              mealType: meal.mealType,
              plannedTime: meal.plannedTime,
            },
          });
          for (const item of meal.items) {
            if (item.recipeId) {
              await tx.dietPlanMealItem.create({
                data: {
                  dietPlanMealId: newMeal.id,
                  recipeId: item.recipeId,
                  quantity: Number(item.quantity) * scaleFactor,
                  unit: item.unit,
                },
              });
              continue;
            }
            if (!item.foodItemId) continue;
            await tx.dietPlanMealItem.create({
              data: {
                dietPlanMealId: newMeal.id,
                foodItemId: item.foodItemId,
                quantity: Number(item.quantity) * scaleFactor,
                unit: item.unit,
              },
            });
          }
        }
      }

      return newPlan.id;
    });

    const newPlan = await this.loadPlanHierarchy(newPlanId);
    if (!newPlan) {
      throw new DietPlanNotFoundError();
    }
    return toDietPlanDetail(newPlan);
  }

  private async getOwnDietitianProfile(userId: string) {
    const profile = await this.prisma.dietitianProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new DietitianProfileNotFoundError();
    }
    return profile;
  }

  private async assertClientLinked(dietitianProfileId: string, clientId: string) {
    const link = await this.prisma.clientDietitianLink.findFirst({
      where: { dietitianId: dietitianProfileId, clientId, status: "ACTIVE" },
    });
    if (!link) {
      throw new ClientNotLinkedError();
    }
  }

  private async assertCanViewPlan(
    userId: string,
    role: Role,
    plan: { clientId: string; dietitianId: string | null },
  ) {
    if (role === "DIETITIAN") {
      const profile = await this.prisma.dietitianProfile.findUnique({ where: { userId } });
      if (!profile || plan.dietitianId !== profile.id) {
        throw new DietPlanAccessDeniedError();
      }
      return;
    }
    if (role === "CLIENT") {
      const profile = await this.prisma.clientProfile.findUnique({ where: { userId } });
      if (!profile || plan.clientId !== profile.id) {
        throw new DietPlanAccessDeniedError();
      }
      return;
    }
    throw new DietPlanAccessDeniedError();
  }

  private async loadPlanHierarchy(dietPlanId: string): Promise<DietPlanWithHierarchy | null> {
    return this.prisma.dietPlan.findUnique({
      where: { id: dietPlanId },
      include: PLAN_HIERARCHY_INCLUDE,
    });
  }
}
