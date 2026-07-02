import { Injectable } from "@nestjs/common";
import type { Prisma } from "@fit-sihirbaz/db";
import type {
  AdminListUsersInput,
  AdminListUsersResult,
  PublicUser,
  UpdateProfileInput,
} from "@fit-sihirbaz/shared";
import { PrismaService } from "../prisma/prisma.service";
import { toPublicUser } from "../auth/auth.mapper";
import { CannotDeactivateSelfError, UserNotFoundError } from "./users.errors";
import { toAdminUserSummary } from "./users.mapper";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<PublicUser> {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      throw new UserNotFoundError();
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: input,
    });
    return toPublicUser(user);
  }

  async registerPushToken(userId: string, token: string): Promise<void> {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      throw new UserNotFoundError();
    }
    await this.prisma.user.update({ where: { id: userId }, data: { expoPushToken: token } });
  }

  async adminList(input: AdminListUsersInput): Promise<AdminListUsersResult> {
    const where: Prisma.UserWhereInput = {
      ...(input.role ? { role: input.role } : {}),
      ...(input.query
        ? {
            OR: [
              { email: { contains: input.query, mode: "insensitive" } },
              { firstName: { contains: input.query, mode: "insensitive" } },
              { lastName: { contains: input.query, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items: rows.map(toAdminUserSummary), total };
  }

  async adminSetActive(adminUserId: string, targetUserId: string, isActive: boolean) {
    if (adminUserId === targetUserId && !isActive) {
      throw new CannotDeactivateSelfError();
    }
    const existing = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!existing) {
      throw new UserNotFoundError();
    }
    const user = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isActive },
    });
    return toAdminUserSummary(user);
  }
}
