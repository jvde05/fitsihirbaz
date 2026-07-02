import { Injectable } from "@nestjs/common";
import type { Prisma } from "@fit-sihirbaz/db";
import type {
  BrowsePackagesInput,
  BrowsePackagesResult,
  CreatePackageInput,
  Package,
  PackageWithDietitian,
  UpdatePackageInput,
} from "@fit-sihirbaz/shared";
import { PrismaService } from "../prisma/prisma.service";
import { DietitianProfileNotFoundError, PackageAccessDeniedError, PackageNotFoundError } from "./packages.errors";
import { toPackage, toPackageWithDietitian } from "./packages.mapper";

@Injectable()
export class PackagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dietitianUserId: string, input: CreatePackageInput): Promise<Package> {
    const dietitianProfile = await this.getOwnDietitianProfile(dietitianUserId);
    const pkg = await this.prisma.package.create({
      data: {
        dietitianId: dietitianProfile.id,
        title: input.title,
        description: input.description,
        durationDays: input.durationDays,
        sessionCount: input.sessionCount,
        price: input.price,
        currency: input.currency,
      },
    });
    return toPackage(pkg);
  }

  async update(dietitianUserId: string, input: UpdatePackageInput): Promise<Package> {
    const dietitianProfile = await this.getOwnDietitianProfile(dietitianUserId);
    const existing = await this.prisma.package.findUnique({ where: { id: input.id } });
    if (!existing) {
      throw new PackageNotFoundError();
    }
    if (existing.dietitianId !== dietitianProfile.id) {
      throw new PackageAccessDeniedError();
    }

    const pkg = await this.prisma.package.update({
      where: { id: input.id },
      data: {
        title: input.title,
        description: input.description,
        durationDays: input.durationDays,
        sessionCount: input.sessionCount,
        price: input.price,
        isActive: input.isActive,
      },
    });
    return toPackage(pkg);
  }

  async listMine(dietitianUserId: string): Promise<Package[]> {
    const dietitianProfile = await this.getOwnDietitianProfile(dietitianUserId);
    const packages = await this.prisma.package.findMany({
      where: { dietitianId: dietitianProfile.id },
      orderBy: { createdAt: "desc" },
    });
    return packages.map(toPackage);
  }

  async getById(id: string): Promise<PackageWithDietitian> {
    const pkg = await this.prisma.package.findUnique({
      where: { id },
      include: { dietitian: { include: { user: true } } },
    });
    if (!pkg || !pkg.isActive) {
      throw new PackageNotFoundError();
    }
    return toPackageWithDietitian(pkg);
  }

  async browse(input: BrowsePackagesInput): Promise<BrowsePackagesResult> {
    const where: Prisma.PackageWhereInput = {
      isActive: true,
      ...(input.dietitianId ? { dietitianId: input.dietitianId } : {}),
      ...(input.minPrice !== undefined || input.maxPrice !== undefined
        ? {
            price: {
              ...(input.minPrice !== undefined ? { gte: input.minPrice } : {}),
              ...(input.maxPrice !== undefined ? { lte: input.maxPrice } : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.package.findMany({
        where,
        include: { dietitian: { include: { user: true } } },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      }),
      this.prisma.package.count({ where }),
    ]);

    return { items: rows.map(toPackageWithDietitian), total };
  }

  private async getOwnDietitianProfile(userId: string) {
    const profile = await this.prisma.dietitianProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new DietitianProfileNotFoundError();
    }
    return profile;
  }
}
