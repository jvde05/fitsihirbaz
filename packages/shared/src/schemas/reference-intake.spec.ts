import { FindReferenceIntakesForProfileInputSchema, UpsertReferenceIntakeInputSchema } from "./reference-intake";

describe("UpsertReferenceIntakeInputSchema", () => {
  const validInput = {
    nutrient: "ENERGY",
    unit: "kcal",
    ageMinYears: 19,
    ageMaxYears: 50,
    sex: "MALE",
    sourceLabel: "Genel referans değer — TÜBER ile doğrulanmalı",
    value: 2500,
  };

  it("geçerli bir referans değer girdisini kabul eder", () => {
    const result = UpsertReferenceIntakeInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lifeStage).toBe("NONE");
      expect(result.data.isVerifiedSource).toBe(false);
    }
  });

  it("boş ageMaxYears'i (doldurulmamış form alanı) undefined'a çevirir", () => {
    const result = UpsertReferenceIntakeInputSchema.safeParse({ ...validInput, ageMaxYears: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ageMaxYears).toBeUndefined();
    }
  });

  it("kaynak açıklaması olmayan girdiyi reddeder", () => {
    const { sourceLabel: _sourceLabel, ...withoutSource } = validInput;
    expect(UpsertReferenceIntakeInputSchema.safeParse(withoutSource).success).toBe(false);
  });
});

describe("FindReferenceIntakesForProfileInputSchema", () => {
  it("geçerli bir profil girdisini kabul eder ve lifeStage'i varsayılan NONE yapar", () => {
    const result = FindReferenceIntakesForProfileInputSchema.safeParse({ ageYears: 30, sex: "FEMALE" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lifeStage).toBe("NONE");
    }
  });

  it("ALL cinsiyetini reddeder (profil sorgusu MALE/FEMALE ile sınırlı)", () => {
    expect(FindReferenceIntakesForProfileInputSchema.safeParse({ ageYears: 30, sex: "ALL" }).success).toBe(false);
  });
});
