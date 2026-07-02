import { Injectable } from "@nestjs/common";
import type { PublicUser, UpdateProfileInput } from "@fit-sihirbaz/shared";
import { PrismaService } from "../prisma/prisma.service";
import { toPublicUser } from "../auth/auth.mapper";
import { UserNotFoundError } from "./users.errors";

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
}
