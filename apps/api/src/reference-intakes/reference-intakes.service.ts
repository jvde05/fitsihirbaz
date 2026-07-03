import { Injectable } from "@nestjs/common";
import type {
  FindReferenceIntakesForProfileInput,
  ListReferenceIntakesInput,
  ReferenceIntake,
  UpsertReferenceIntakeInput,
} from "@fit-sihirbaz/shared";
import { PrismaService } from "../prisma/prisma.service";
import { ReferenceIntakeNotFoundError } from "./reference-intakes.errors";
import { toReferenceIntake } from "./reference-intakes.mapper";

@Injectable()
export class ReferenceIntakesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(input: ListReferenceIntakesInput): Promise<ReferenceIntake[]> {
    const rows = await this.prisma.referenceIntake.findMany({
      where: input.nutrient ? { nutrient: input.nutrient } : undefined,
      orderBy: [{ nutrient: "asc" }, { ageMinYears: "asc" }],
    });
    return rows.map(toReferenceIntake);
  }

  async findForProfile(input: FindReferenceIntakesForProfileInput): Promise<ReferenceIntake[]> {
    const rows = await this.prisma.referenceIntake.findMany({
      where: {
        ageMinYears: { lte: input.ageYears },
        OR: [{ ageMaxYears: null }, { ageMaxYears: { gte: input.ageYears } }],
        sex: { in: [input.sex, "ALL"] },
        lifeStage: input.lifeStage,
      },
      orderBy: { nutrient: "asc" },
    });
    return rows.map(toReferenceIntake);
  }

  async upsert(input: UpsertReferenceIntakeInput): Promise<ReferenceIntake> {
    const data = {
      nutrient: input.nutrient,
      unit: input.unit,
      ageMinYears: input.ageMinYears,
      ageMaxYears: input.ageMaxYears ?? null,
      sex: input.sex,
      lifeStage: input.lifeStage,
      value: input.value,
      sourceLabel: input.sourceLabel,
      isVerifiedSource: input.isVerifiedSource,
      notes: input.notes ?? null,
    };

    if (!input.id) {
      const created = await this.prisma.referenceIntake.create({ data });
      return toReferenceIntake(created);
    }

    const existing = await this.prisma.referenceIntake.findUnique({ where: { id: input.id } });
    if (!existing) {
      throw new ReferenceIntakeNotFoundError();
    }
    const updated = await this.prisma.referenceIntake.update({ where: { id: input.id }, data });
    return toReferenceIntake(updated);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.prisma.referenceIntake.findUnique({ where: { id } });
    if (!existing) {
      throw new ReferenceIntakeNotFoundError();
    }
    await this.prisma.referenceIntake.delete({ where: { id } });
  }
}
