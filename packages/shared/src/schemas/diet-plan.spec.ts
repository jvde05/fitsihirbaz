import {
  AddDietPlanMealInputSchema,
  CreateDietPlanInputSchema,
  DuplicateForNewCalorieTargetInputSchema,
} from "./diet-plan";

describe("CreateDietPlanInputSchema", () => {
  const validInput = {
    clientId: "123e4567-e89b-12d3-a456-426614174000",
    title: "3 Aylık Kilo Verme Planı",
    startDate: "2026-07-01",
  };

  it("geçerli girdiyi kabul eder", () => {
    expect(CreateDietPlanInputSchema.safeParse(validInput).success).toBe(true);
  });

  it("geçersiz tarih formatını reddeder", () => {
    const result = CreateDietPlanInputSchema.safeParse({ ...validInput, startDate: "01.07.2026" });
    expect(result.success).toBe(false);
  });

  it("boş başlığı reddeder", () => {
    const result = CreateDietPlanInputSchema.safeParse({ ...validInput, title: "" });
    expect(result.success).toBe(false);
  });
});

describe("AddDietPlanMealInputSchema", () => {
  it("HH:MM formatındaki saati kabul eder", () => {
    const result = AddDietPlanMealInputSchema.safeParse({
      dietPlanDayId: "123e4567-e89b-12d3-a456-426614174000",
      mealType: "BREAKFAST",
      plannedTime: "08:30",
    });
    expect(result.success).toBe(true);
  });

  it("geçersiz saat formatını reddeder", () => {
    const result = AddDietPlanMealInputSchema.safeParse({
      dietPlanDayId: "123e4567-e89b-12d3-a456-426614174000",
      mealType: "BREAKFAST",
      plannedTime: "8:30am",
    });
    expect(result.success).toBe(false);
  });
});

describe("DuplicateForNewCalorieTargetInputSchema", () => {
  it("pozitif kalori hedefini kabul eder", () => {
    const result = DuplicateForNewCalorieTargetInputSchema.safeParse({
      dietPlanId: "123e4567-e89b-12d3-a456-426614174000",
      newTargetCalories: 1800,
    });
    expect(result.success).toBe(true);
  });

  it("negatif kalori hedefini reddeder", () => {
    const result = DuplicateForNewCalorieTargetInputSchema.safeParse({
      dietPlanId: "123e4567-e89b-12d3-a456-426614174000",
      newTargetCalories: -100,
    });
    expect(result.success).toBe(false);
  });
});
