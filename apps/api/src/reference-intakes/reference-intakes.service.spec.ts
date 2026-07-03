import { ReferenceIntakesService } from "./reference-intakes.service";
import { PrismaService } from "../prisma/prisma.service";
import { ReferenceIntakeNotFoundError } from "./reference-intakes.errors";

function buildRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "ri-1",
    nutrient: "ENERGY",
    unit: "kcal",
    ageMinYears: 19,
    ageMaxYears: 50,
    sex: "MALE",
    lifeStage: "NONE",
    value: 2500 as unknown,
    sourceLabel: "Genel referans değer — TÜBER ile doğrulanmalı",
    isVerifiedSource: false,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("ReferenceIntakesService", () => {
  let prisma: {
    referenceIntake: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let service: ReferenceIntakesService;

  beforeEach(() => {
    prisma = {
      referenceIntake: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new ReferenceIntakesService(prisma as unknown as PrismaService);
  });

  describe("list", () => {
    it("nutrient filtresi verilmezse tüm kayıtları döner", async () => {
      prisma.referenceIntake.findMany.mockResolvedValue([buildRow()]);
      const result = await service.list({});
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(2500);
      expect(prisma.referenceIntake.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });

    it("nutrient filtresi verilirse where'e ekler", async () => {
      prisma.referenceIntake.findMany.mockResolvedValue([]);
      await service.list({ nutrient: "PROTEIN" });
      expect(prisma.referenceIntake.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { nutrient: "PROTEIN" } }),
      );
    });
  });

  describe("findForProfile", () => {
    it("yaş/cinsiyet/yaşam evresine göre uygun where koşulunu kurar", async () => {
      prisma.referenceIntake.findMany.mockResolvedValue([buildRow()]);
      const result = await service.findForProfile({ ageYears: 30, sex: "MALE", lifeStage: "NONE" });
      expect(result).toHaveLength(1);
      expect(prisma.referenceIntake.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ageMinYears: { lte: 30 },
            sex: { in: ["MALE", "ALL"] },
            lifeStage: "NONE",
          }),
        }),
      );
    });
  });

  describe("upsert", () => {
    it("id verilmezse yeni kayıt oluşturur", async () => {
      prisma.referenceIntake.create.mockResolvedValue(buildRow());
      const result = await service.upsert({
        nutrient: "ENERGY",
        unit: "kcal",
        ageMinYears: 19,
        sex: "MALE",
        lifeStage: "NONE",
        value: 2500,
        sourceLabel: "Genel referans değer — TÜBER ile doğrulanmalı",
        isVerifiedSource: false,
      });
      expect(result.nutrient).toBe("ENERGY");
      expect(prisma.referenceIntake.create).toHaveBeenCalled();
    });

    it("id verilir ama kayıt yoksa ReferenceIntakeNotFoundError fırlatır", async () => {
      prisma.referenceIntake.findUnique.mockResolvedValue(null);
      await expect(
        service.upsert({
          id: "missing-id",
          nutrient: "ENERGY",
          unit: "kcal",
          ageMinYears: 19,
          sex: "MALE",
          lifeStage: "NONE",
          value: 2500,
          sourceLabel: "Genel referans değer",
          isVerifiedSource: false,
        }),
      ).rejects.toBeInstanceOf(ReferenceIntakeNotFoundError);
    });

    it("id verilir ve kayıt varsa günceller", async () => {
      prisma.referenceIntake.findUnique.mockResolvedValue(buildRow());
      prisma.referenceIntake.update.mockResolvedValue(buildRow({ value: 2600 as unknown }));
      const result = await service.upsert({
        id: "ri-1",
        nutrient: "ENERGY",
        unit: "kcal",
        ageMinYears: 19,
        sex: "MALE",
        lifeStage: "NONE",
        value: 2600,
        sourceLabel: "Genel referans değer",
        isVerifiedSource: false,
      });
      expect(result.value).toBe(2600);
      expect(prisma.referenceIntake.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "ri-1" } }),
      );
    });
  });

  describe("delete", () => {
    it("kayıt yoksa ReferenceIntakeNotFoundError fırlatır", async () => {
      prisma.referenceIntake.findUnique.mockResolvedValue(null);
      await expect(service.delete("missing-id")).rejects.toBeInstanceOf(ReferenceIntakeNotFoundError);
    });

    it("kayıt varsa siler", async () => {
      prisma.referenceIntake.findUnique.mockResolvedValue(buildRow());
      await service.delete("ri-1");
      expect(prisma.referenceIntake.delete).toHaveBeenCalledWith({ where: { id: "ri-1" } });
    });
  });
});
