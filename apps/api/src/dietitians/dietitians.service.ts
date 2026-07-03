import { Injectable } from "@nestjs/common";
import type { Prisma } from "@fit-sihirbaz/db";
import type {
  AdminListDietitiansInput,
  ClientSummary,
  DietitianProfile,
  DietitianPublicSummary,
  DietitianSearchInput,
  DietitianSearchResult,
  UpdateDietitianProfileInput,
} from "@fit-sihirbaz/shared";

const MAX_CERTIFICATION_COUNT = 10;
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { DietitianProfileNotFoundError } from "./dietitians.errors";
import { toClientSummary, toDietitianProfile, toDietitianPublicSummary } from "./dietitians.mapper";

@Injectable()
export class DietitiansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

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

  async getPublicProfile(dietitianProfileId: string): Promise<DietitianPublicSummary> {
    const row = await this.prisma.dietitianProfile.findUnique({
      where: { id: dietitianProfileId },
      include: { user: true },
    });
    if (!row) {
      throw new DietitianProfileNotFoundError();
    }
    return toDietitianPublicSummary(row);
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

  async adminList(input: AdminListDietitiansInput): Promise<DietitianProfile[]> {
    const rows = await this.prisma.dietitianProfile.findMany({
      where: input.status ? { verificationStatus: input.status } : {},
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });
    // Admin doğrulama kuyruğu lisans no + sertifika belgelerini görmeli, bu yüzden
    // pazaryeri vitrininde kullanılan public summary değil tam profil döner.
    return rows.map(toDietitianProfile);
  }

  async adminVerify(dietitianProfileId: string, status: "VERIFIED" | "REJECTED"): Promise<DietitianProfile> {
    const existing = await this.prisma.dietitianProfile.findUnique({ where: { id: dietitianProfileId } });
    if (!existing) {
      throw new DietitianProfileNotFoundError();
    }
    const row = await this.prisma.dietitianProfile.update({
      where: { id: dietitianProfileId },
      data: { verificationStatus: status },
      include: { user: true },
    });

    await this.notifications.create(row.user.id, status === "VERIFIED" ? "DIETITIAN_VERIFIED" : "DIETITIAN_REJECTED", {});

    return toDietitianProfile(row);
  }

  async addCertification(userId: string, url: string): Promise<DietitianProfile> {
    const existing = await this.prisma.dietitianProfile.findUnique({ where: { userId } });
    if (!existing) {
      throw new DietitianProfileNotFoundError();
    }
    const certificationUrls = existing.certificationUrls.includes(url)
      ? existing.certificationUrls
      : [...existing.certificationUrls, url].slice(0, MAX_CERTIFICATION_COUNT);
    const row = await this.prisma.dietitianProfile.update({
      where: { userId },
      data: { certificationUrls },
      include: { user: true },
    });
    return toDietitianProfile(row);
  }

  async removeCertification(userId: string, url: string): Promise<DietitianProfile> {
    const existing = await this.prisma.dietitianProfile.findUnique({ where: { userId } });
    if (!existing) {
      throw new DietitianProfileNotFoundError();
    }
    const row = await this.prisma.dietitianProfile.update({
      where: { userId },
      data: { certificationUrls: existing.certificationUrls.filter((existingUrl) => existingUrl !== url) },
      include: { user: true },
    });
    return toDietitianProfile(row);
  }
}
