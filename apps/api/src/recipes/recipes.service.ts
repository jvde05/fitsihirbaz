import { Injectable } from "@nestjs/common";
import type { Prisma } from "@fit-sihirbaz/db";
import type { RecipeCreateInput, RecipeDetail, RecipeSummary, RecipeUpdateInput, Role } from "@fit-sihirbaz/shared";
import { PrismaService } from "../prisma/prisma.service";
import {
  RecipeAccessDeniedError,
  RecipeIngredientFoodItemNotFoundError,
  RecipeNotFoundError,
} from "./recipes.errors";
import { toRecipeDetail, toRecipeSummary } from "./recipes.mapper";

const RECIPE_INCLUDE = {
  ingredients: { include: { foodItem: { include: { nutrientData: true } } } },
};

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, input: RecipeCreateInput): Promise<RecipeDetail> {
    await this.assertFoodItemsExist(input.ingredients.map((ingredient) => ingredient.foodItemId));

    const recipe = await this.prisma.recipe.create({
      data: {
        name: input.name,
        description: input.description,
        servings: input.servings,
        instructions: input.instructions,
        isPublic: input.isPublic,
        createdByUserId: userId,
        ingredients: {
          create: input.ingredients.map((ingredient) => ({
            foodItemId: ingredient.foodItemId,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
          })),
        },
      },
      include: RECIPE_INCLUDE,
    });

    return toRecipeDetail(recipe);
  }

  async update(userId: string, role: Role, input: RecipeUpdateInput): Promise<RecipeDetail> {
    const existing = await this.prisma.recipe.findUnique({ where: { id: input.id } });
    if (!existing) {
      throw new RecipeNotFoundError();
    }
    this.assertCanModify(userId, role, existing.createdByUserId);
    await this.assertFoodItemsExist(input.ingredients.map((ingredient) => ingredient.foodItemId));

    const recipe = await this.prisma.$transaction(async (tx) => {
      await tx.recipeIngredient.deleteMany({ where: { recipeId: input.id } });
      return tx.recipe.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          servings: input.servings,
          instructions: input.instructions,
          isPublic: input.isPublic,
          ingredients: {
            create: input.ingredients.map((ingredient) => ({
              foodItemId: ingredient.foodItemId,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
            })),
          },
        },
        include: RECIPE_INCLUDE,
      });
    });

    return toRecipeDetail(recipe);
  }

  async getById(userId: string, role: Role, id: string): Promise<RecipeDetail> {
    const recipe = await this.prisma.recipe.findUnique({ where: { id }, include: RECIPE_INCLUDE });
    if (!recipe) {
      throw new RecipeNotFoundError();
    }
    if (!recipe.isPublic) {
      this.assertCanModify(userId, role, recipe.createdByUserId);
    }
    return toRecipeDetail(recipe);
  }

  async list(userId: string, role: Role, mineOnly: boolean): Promise<RecipeSummary[]> {
    const where: Prisma.RecipeWhereInput = mineOnly
      ? { createdByUserId: userId }
      : role === "ADMIN"
        ? {}
        : { OR: [{ isPublic: true }, { createdByUserId: userId }] };

    const recipes = await this.prisma.recipe.findMany({
      where,
      include: RECIPE_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
    return recipes.map(toRecipeSummary);
  }

  private assertCanModify(userId: string, role: Role, createdByUserId: string): void {
    if (role === "ADMIN") {
      return;
    }
    if (createdByUserId !== userId) {
      throw new RecipeAccessDeniedError();
    }
  }

  private async assertFoodItemsExist(foodItemIds: string[]): Promise<void> {
    const uniqueIds = [...new Set(foodItemIds)];
    const count = await this.prisma.foodItem.count({ where: { id: { in: uniqueIds } } });
    if (count !== uniqueIds.length) {
      throw new RecipeIngredientFoodItemNotFoundError();
    }
  }
}
