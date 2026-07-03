import { Injectable } from "@nestjs/common";
import { Prisma } from "@fit-sihirbaz/db";
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
// word_similarity(query, name) — similarity()'den farklı olarak query'yi name'in tamamına
// değil en iyi eşleşen alt-diziye (kelimeye) göre kıyaslar; bu yüzden "Tavuk Göğsü (haşlanmış)"
// gibi çok kelimeli isimlere kısa aramalar da (örn. "tavuk") yüksek skor alır. Eşik 0.3,
// tek karakterlik yazım hatalarını (silme/ekleme/harf değişimi) genelde yakalar.
const TRIGRAM_SIMILARITY_THRESHOLD = 0.3;

@Injectable()
export class FoodsService {
  constructor(private readonly prisma: PrismaService) {}

  // pg_trgm ile typo-toleranslı arama: substring eşleşmesi (ILIKE) veya trigram benzerliği
  // eşiği üstündeki kayıtlar, benzerlik skoruna göre sıralanıp döner (bkz. migration
  // add_food_trigram_search — GIN index'ler ve pg_trgm extension'ı orada eklenir).
  async search(input: FoodSearchInput): Promise<FoodSearchResult> {
    const categoryFilter = input.category
      ? Prisma.sql`AND category ILIKE ${input.category}`
      : Prisma.empty;

    const rankedRows = await this.prisma.$queryRaw<{ id: string; total: bigint }[]>`
      SELECT id, count(*) OVER() AS total
      FROM "FoodItem"
      WHERE (
        name ILIKE ${"%" + input.query + "%"}
        OR "nameEn" ILIKE ${"%" + input.query + "%"}
        OR word_similarity(${input.query}, name) > ${TRIGRAM_SIMILARITY_THRESHOLD}
        OR word_similarity(${input.query}, coalesce("nameEn", '')) > ${TRIGRAM_SIMILARITY_THRESHOLD}
      )
      ${categoryFilter}
      ORDER BY
        GREATEST(word_similarity(${input.query}, name), word_similarity(${input.query}, coalesce("nameEn", ''))) DESC,
        "isVerified" DESC,
        name ASC
      LIMIT ${input.limit}
      OFFSET ${input.offset}
    `;

    const total = rankedRows.length > 0 ? Number(rankedRows[0].total) : 0;
    if (rankedRows.length === 0) {
      return { items: [], total: 0 };
    }

    const ids = rankedRows.map((row) => row.id);
    const rows = await this.prisma.foodItem.findMany({
      where: { id: { in: ids } },
      include: { nutrientData: true },
    });
    const rowById = new Map(rows.map((row) => [row.id, row]));
    const orderedRows = ids.map((id) => rowById.get(id)).filter((row): row is NonNullable<typeof row> => row !== undefined);

    return {
      items: orderedRows
        .filter((row) => row.nutrientData !== null)
        .map((row) => toFoodSummary({ ...row, nutrientData: row.nutrientData! })),
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
