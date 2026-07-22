import {
  AdminVerifyFoodInputSchema,
  FoodCreateInputSchema,
  FoodSearchInputSchema,
  FoodUpdateImageInputSchema,
} from "./food";

describe("FoodSearchInputSchema", () => {
  it("boş sorguyu reddeder", () => {
    expect(FoodSearchInputSchema.safeParse({ query: "" }).success).toBe(false);
  });

  it("limit ve offset için varsayılan değer atar", () => {
    const result = FoodSearchInputSchema.safeParse({ query: "elma" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
      expect(result.data.offset).toBe(0);
    }
  });

  it("limit üst sınırını (50) aşan değeri reddeder", () => {
    expect(FoodSearchInputSchema.safeParse({ query: "elma", limit: 200 }).success).toBe(false);
  });
});

describe("FoodCreateInputSchema", () => {
  const validInput = {
    name: "Elma",
    category: "Meyveler",
    calories: 52,
    protein: 0.3,
    carbs: 13.8,
    fat: 0.2,
  };

  it("geçerli bir besin girdisini kabul eder", () => {
    expect(FoodCreateInputSchema.safeParse(validInput).success).toBe(true);
  });

  it("negatif kalori değerini reddeder", () => {
    const result = FoodCreateInputSchema.safeParse({ ...validInput, calories: -10 });
    expect(result.success).toBe(false);
  });

  it("boş besin adını reddeder", () => {
    const result = FoodCreateInputSchema.safeParse({ ...validInput, name: "" });
    expect(result.success).toBe(false);
  });
});

describe("AdminVerifyFoodInputSchema", () => {
  it("geçerli uuid ve approve alanını kabul eder", () => {
    const result = AdminVerifyFoodInputSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      approve: true,
    });
    expect(result.success).toBe(true);
  });

  it("geçersiz uuid'yi reddeder", () => {
    const result = AdminVerifyFoodInputSchema.safeParse({ id: "not-a-uuid", approve: true });
    expect(result.success).toBe(false);
  });
});

describe("FoodUpdateImageInputSchema", () => {
  it("geçerli uuid ve imageUrl'i kabul eder", () => {
    const result = FoodUpdateImageInputSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      imageUrl: "/uploads/foods/x.png",
    });
    expect(result.success).toBe(true);
  });

  it("boş imageUrl'i reddeder", () => {
    const result = FoodUpdateImageInputSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      imageUrl: "",
    });
    expect(result.success).toBe(false);
  });
});
