import { Injectable } from "@nestjs/common";
import type { Prisma } from "@fit-sihirbaz/db";
import type {
  ClientSummary,
  DietitianProfile,
  DietitianSearchInput,
  DietitianSearchResult,
  UpdateDietitianProfileInput,
} from "@fit-sihirbaz/shared";
import { PrismaService } from "../prisma/prisma.service";
import { DietitianProfileNotFoundError } from "./dietitians.errors";
import { toClientSummary, toDietitianProfile, toDietitianPublicSummary } from "./dietitians.mapper";

@Injectable()
export class DietitiansService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: string): Promise<DietitianProfile> {
    const row = await this.prisma.dietitianProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!row) {
      throw new DietitianProfileNotFoundError();
    }
    return toDietitianProfile(row);
  }

  async updateMyProfile(userId: string, input: UpdateDietitianProfileInput): Promise<DietitianProfile> {
    const existing = await this.prisma.dietitianProfile.findUnique({ where: { userId } });
    if (!existing) {
      throw new DietitianProfileNotFoundError();
    }
    const row = await this.prisma.dietitianProfile.update({
      where: { userId },
      data: input,
      include: { user: true },
    });
    return toDietitianProfile(row);
  }

  async search(input: DietitianSearchInput): Promise<DietitianSearchResult> {
    const where: Prisma.DietitianProfileWhereInput = {
      ...(input.specialty ? { specialties: { has: input.specialty } } : {}),
      ...(input.minRating !== undefined ? { averageRating: { gte: input.minRating } } : {}),
      ...(input.query
        ? {
            OR: [
              { title: { contains: input.query, mode: "insensitive" } },
              { user: { firstName: { contains: input.query, mode: "insensitive" } } },
              { user: { lastName: { contains: input.query, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.dietitianProfile.findMany({
        where,
        include: { user: true },
        orderBy: [{ averageRating: "desc" }, { createdAt: "desc" }],
        take: input.limit,
        skip: input.offset,
      }),
      this.prisma.dietitianProfile.count({ where }),
    ]);

    return { items: rows.map(toDietitianPublicSummary), total };
  }

  async getMyClients(dietitianUserId: string): Promise<ClientSummary[]> {
    const dietitianProfile = await this.prisma.dietitianProfile.findUnique({
      where: { userId: dietitianUserId },
    });
    if (!dietitianProfile) {
      throw new DietitianProfileNotFoundError();
    }

    const links = await this.prisma.clientDietitianLink.findMany({
      where: { dietitianId: dietitianProfile.id, status: "ACTIVE" },
      include: { client: { include: { user: true } } },
      orderBy: { startedAt: "desc" },
    });

    return links.map(toClientSummary);
  }
}
