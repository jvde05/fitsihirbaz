import { Injectable } from "@nestjs/common";
import type { ClientProfile, UpdateClientProfileInput } from "@fit-sihirbaz/shared";
import { PrismaService } from "../prisma/prisma.service";
import {
  AlreadyLinkedError,
  ClientProfileNotFoundError,
  ClientUserNotFoundError,
  DietitianNotFoundError,
} from "./clients.errors";
import { toClientProfile } from "./clients.mapper";

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: string): Promise<ClientProfile> {
    const row = await this.prisma.clientProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!row) {
      throw new ClientProfileNotFoundError();
    }
    return toClientProfile(row);
  }

  async updateMyProfile(userId: string, input: UpdateClientProfileInput): Promise<ClientProfile> {
    const existing = await this.prisma.clientProfile.findUnique({ where: { userId } });
    if (!existing) {
      throw new ClientProfileNotFoundError();
    }
    const row = await this.prisma.clientProfile.update({
      where: { userId },
      data: {
        ...input,
        birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
      },
      include: { user: true },
    });
    return toClientProfile(row);
  }

  async linkToDietitian(dietitianUserId: string, clientEmail: string): Promise<{ success: true }> {
    const dietitianProfile = await this.prisma.dietitianProfile.findUnique({
      where: { userId: dietitianUserId },
    });
    if (!dietitianProfile) {
      throw new DietitianNotFoundError();
    }

    const clientUser = await this.prisma.user.findUnique({ where: { email: clientEmail } });
    if (!clientUser || clientUser.role !== "CLIENT") {
      throw new ClientUserNotFoundError();
    }

    const clientProfile = await this.prisma.clientProfile.findUnique({ where: { userId: clientUser.id } });
    if (!clientProfile) {
      throw new ClientUserNotFoundError();
    }

    const existingActiveLink = await this.prisma.clientDietitianLink.findFirst({
      where: { clientId: clientProfile.id, dietitianId: dietitianProfile.id, status: "ACTIVE" },
    });
    if (existingActiveLink) {
      throw new AlreadyLinkedError();
    }

    await this.prisma.clientDietitianLink.create({
      data: {
        clientId: clientProfile.id,
        dietitianId: dietitianProfile.id,
        status: "ACTIVE",
        startedAt: new Date(),
        source: "MANUAL_ADD",
      },
    });

    return { success: true };
  }
}
