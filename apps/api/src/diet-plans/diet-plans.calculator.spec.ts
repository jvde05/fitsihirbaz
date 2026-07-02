import { addTotals, calculateItemNutrients, zeroTotals } from "./diet-plans.calculator";

describe("calculateItemNutrients", () => {
  const apple = {
    caloriesPer100g: 52,
    proteinPer100g: 0.3,
    carbsPer100g: 13.8,
    fatPer100g: 0.2,
  };

  it("GRAM birimi için doğrudan gram miktarını kullanır", () => {
    const result = calculateItemNutrients({ ...apple, servingGramWeight: 182, quantity: 100, unit: "GRAM" });
    expect(result).toEqual({ calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2 });
  });

  it("PORTION birimi için servingGramWeight ile ölçeklendirir", () => {
    // 1 porsiyon = 182g -> 2 porsiyon = 364g -> faktör 3.64
    const result = calculateItemNutrients({ ...apple, servingGramWeight: 182, quantity: 2, unit: "PORTION" });
    expect(result.calories).toBeCloseTo(52 * 3.64, 1);
  });

  it("servingGramWeight tanımsızsa 100g varsayar", () => {
    const result = calculateItemNutrients({ ...apple, servingGramWeight: null, quantity: 1, unit: "PIECE" });
    expect(result).toEqual({ calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2 });
  });

  it("ML birimini GRAM gibi ele alır", () => {
    const result = calculateItemNutrients({ ...apple, servingGramWeight: null, quantity: 250, unit: "ML" });
    expect(result.calories).toBeCloseTo(52 * 2.5, 1);
  });
});

describe("addTotals / zeroTotals", () => {
  it("iki toplamı doğru şekilde birleştirir", () => {
    const a = { calories: 100, protein: 10, carbs: 20, fat: 5 };
    const b = { calories: 50, protein: 5, carbs: 10, fat: 2 };
    expect(addTotals(a, b)).toEqual({ calories: 150, protein: 15, carbs: 30, fat: 7 });
  });

  it("zeroTotals ile toplama nötr eleman davranışı gösterir", () => {
    const a = { calories: 100, protein: 10, carbs: 20, fat: 5 };
    expect(addTotals(a, zeroTotals())).toEqual(a);
  });
});
