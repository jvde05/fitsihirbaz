import { RecipeCreateInputSchema } from "./recipe";

describe("RecipeCreateInputSchema", () => {
  const validInput = {
    name: "Mercimek Çorbası",
    servings: 4,
    ingredients: [{ foodItemId: "123e4567-e89b-12d3-a456-426614174000", quantity: 200, unit: "GRAM" as const }],
  };

  it("geçerli bir tarif girdisini kabul eder", () => {
    const result = RecipeCreateInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPublic).toBe(false);
    }
  });

  it("malzemesi olmayan tarifi reddeder", () => {
    const result = RecipeCreateInputSchema.safeParse({ ...validInput, ingredients: [] });
    expect(result.success).toBe(false);
  });

  it("boş description'ı undefined'a çevirir (optionalCoerced)", () => {
    const result = RecipeCreateInputSchema.safeParse({ ...validInput, description: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeUndefined();
    }
  });

  it("boş tarif adını reddeder", () => {
    const result = RecipeCreateInputSchema.safeParse({ ...validInput, name: "" });
    expect(result.success).toBe(false);
  });

  it("negatif porsiyon sayısını reddeder", () => {
    const result = RecipeCreateInputSchema.safeParse({ ...validInput, servings: -1 });
    expect(result.success).toBe(false);
  });
});
