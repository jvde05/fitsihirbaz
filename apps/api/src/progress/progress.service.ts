import { Injectable } from "@nestjs/common";
import type { AddProgressLogInput, ProgressLog, Role } from "@fit-sihirbaz/shared";
import { PrismaService } from "../prisma/prisma.service";
import {
  ClientProfileNotFoundError,
  DietitianProfileNotFoundError,
  MissingClientIdError,
  ProgressAccessDeniedError,
} from "./progress.errors";
import { toProgressLog } from "./progress.mapper";

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async addLog(clientUserId: string, input: AddProgressLogInput): Promise<ProgressLog> {
    const clientProfile = await this.prisma.clientProfile.findUnique({ where: { userId: clientUserId } });
    if (!clientProfile) {
      throw new ClientProfileNotFoundError();
    }

    const log = await this.prisma.progressLog.create({
      data: {
        clientId: clientProfile.id,
        logDate: new Date(input.logDate),
        weightKg: input.weightKg,
        bodyFatPercent: input.bodyFatPercent,
        waistCm: input.waistCm,
        hipCm: input.hipCm,
        photoUrls: input.photoUrls ?? [],
        notes: input.notes,
      },
    });
    return toProgressLog(log);
  }

  async list(userId: string, role: Role, clientId?: string): Promise<ProgressLog[]> {
    let resolvedClientId: string;

    if (role === "CLIENT") {
      const profile = await this.prisma.clientProfile.findUnique({ where: { userId } });
      if (!profile) {
        throw new ClientProfileNotFoundError();
      }
      resolvedClientId = profile.id;
    } else if (role === "DIETITIAN") {
      if (!clientId) {
        throw new MissingClientIdError();
      }
      const dietitianProfile = await this.prisma.dietitianProfile.findUnique({ where: { userId } });
      if (!dietitianProfile) {
        throw new DietitianProfileNotFoundError();
      }
      const link = await this.prisma.clientDietitianLink.findFirst({
        where: { dietitianId: dietitianProfile.id, clientId, status: "ACTIVE" },
      });
      if (!link) {
        throw new ProgressAccessDeniedError();
      }
      resolvedClientId = clientId;
    } else {
      throw new ProgressAccessDeniedError();
    }

    const logs = await this.prisma.progressLog.findMany({
      where: { clientId: resolvedClientId },
      orderBy: { logDate: "asc" },
    });
    return logs.map(toProgressLog);
  }
}
