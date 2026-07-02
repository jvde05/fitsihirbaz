import { Injectable } from "@nestjs/common";
import type { Prisma } from "@fit-sihirbaz/db";
import type {
  FoodCreateInput,
  FoodDetail,
  FoodSearchInput,
  FoodSearchResult,
} from "@fit-sihirbaz/shared";
import { PrismaService } from "../prisma/prisma.service";
import { FoodNotFoundError } from "./foods.errors";
import { toFoodDetail, toFoodSummary } from "./foods.mapper";

const USER_SUBMITTED_SOURCE_NAME = "Kullanıcı Girişi";

@Injectable()
export class FoodsService {
  constructor(private readonly prisma: PrismaService) {}

  async search(input: FoodSearchInput): Promise<FoodSearchResult> {
    const where: Prisma.FoodItemWhereInput = {
      OR: [
        { name: { contains: input.query, mode: "insensitive" } },
        { nameEn: { contains: input.query, mode: "insensitive" } },
      ],
      ...(input.category ? { category: { equals: input.category, mode: "insensitive" } } : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.foodItem.findMany({
        where,
        include: { nutrientData: true },
        orderBy: [{ isVerified: "desc" }, { name: "asc" }],
        take: input.limit,
        skip: input.offset,
      }),
      this.prisma.foodItem.count({ where }),
    ]);

    return {
      items: rows.filter((row) => row.nutrientData !== null).map((row) => toFoodSummary({ ...row, nutrientData: row.nutrientData! })),
      total,
    };
  }

  async getById(id: string): Promise<FoodDetail> {
    const foodItem = await this.prisma.foodItem.findUnique({
      where: { id },
      include: { nutrientData: true, source: true },
    });
    if (!foodItem || !foodItem.nutrientData) {
      throw new FoodNotFoundError();
    }
    return toFoodDetail({ ...foodItem, nutrientData: foodItem.nutrientData });
  }

  async create(input: FoodCreateInput, createdByUserId: string): Promise<FoodDetail> {
    const source = await this.getOrCreateUserSubmittedSource();
    const foodItem = await this.prisma.foodItem.create({
      data: {
        name: input.name,
        nameEn: input.nameEn,
        category: input.category,
        servingDescription: input.servingDescription,
        servingGramWeight: input.servingGramWeight,
        sourceId: source.id,
        createdByUserId,
        isVerified: false,
        nutrientData: {
          create: {
            calories: input.calories,
            protein: input.protein,
            carbs: input.carbs,
            fat: input.fat,
            fiber: input.fiber,
            sugar: input.sugar,
          },
        },
      },
      include: { nutrientData: true, source: true },
    });
    return toFoodDetail({ ...foodItem, nutrientData: foodItem.nutrientData! });
  }

  async verify(id: string, approve: boolean): Promise<FoodDetail> {
    const existing = await this.prisma.foodItem.findUnique({ where: { id } });
    if (!existing) {
      throw new FoodNotFoundError();
    }

    const foodItem = await this.prisma.foodItem.update({
      where: { id },
      data: { isVerified: approve },
      include: { nutrientData: true, source: true },
    });
    if (!foodItem.nutrientData) {
      throw new FoodNotFoundError();
    }
    return toFoodDetail({ ...foodItem, nutrientData: foodItem.nutrientData });
  }

  private async getOrCreateUserSubmittedSource() {
    const existing = await this.prisma.foodSource.findFirst({
      where: { name: USER_SUBMITTED_SOURCE_NAME },
    });
    if (existing) {
      return existing;
    }
    return this.prisma.foodSource.create({
      data: {
        name: USER_SUBMITTED_SOURCE_NAME,
        citation:
          "Diyetisyen veya admin tarafından platforma manuel olarak girilmiştir; resmi bir literatür kaynağı değildir.",
      },
    });
  }
}
