import { Injectable } from "@nestjs/common";
import type { FoodSource, UpsertFoodSourceInput } from "@fit-sihirbaz/shared";
import { PrismaService } from "../prisma/prisma.service";
import { FoodSourceInUseError, FoodSourceNotFoundError } from "./food-sources.errors";
import { toFoodSource } from "./food-sources.mapper";

@Injectable()
export class FoodSourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<FoodSource[]> {
    const rows = await this.prisma.foodSource.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { foodItems: true } } },
    });
    return rows.map(toFoodSource);
  }

  async upsert(input: UpsertFoodSourceInput): Promise<FoodSource> {
    const data = {
      name: input.name,
      citation: input.citation,
      url: input.url ?? null,
    };

    if (!input.id) {
      const created = await this.prisma.foodSource.create({
        data,
        include: { _count: { select: { foodItems: true } } },
      });
      return toFoodSource(created);
    }

    const existing = await this.prisma.foodSource.findUnique({ where: { id: input.id } });
    if (!existing) {
      throw new FoodSourceNotFoundError();
    }
    const updated = await this.prisma.foodSource.update({
      where: { id: input.id },
      data,
      include: { _count: { select: { foodItems: true } } },
    });
    return toFoodSource(updated);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.prisma.foodSource.findUnique({
      where: { id },
      include: { _count: { select: { foodItems: true } } },
    });
    if (!existing) {
      throw new FoodSourceNotFoundError();
    }
    if (existing._count.foodItems > 0) {
      throw new FoodSourceInUseError();
    }
    await this.prisma.foodSource.delete({ where: { id } });
  }
}
