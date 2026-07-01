import { AddProgressLogInputSchema } from "./progress";

describe("AddProgressLogInputSchema", () => {
  const validInput = { logDate: "2026-07-01" };

  it("yalnızca tarih ile geçerli sayılır (tüm ölçümler opsiyonel)", () => {
    expect(AddProgressLogInputSchema.safeParse(validInput).success).toBe(true);
  });

  it("boş string weightKg değerini (doldurulmamış form alanı) kabul eder", () => {
    const result = AddProgressLogInputSchema.safeParse({ ...validInput, weightKg: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.weightKg).toBeUndefined();
    }
  });

  it("100'den büyük bodyFatPercent değerini reddeder", () => {
    expect(AddProgressLogInputSchema.safeParse({ ...validInput, bodyFatPercent: 150 }).success).toBe(false);
  });

  it("geçersiz tarih formatını reddeder", () => {
    expect(AddProgressLogInputSchema.safeParse({ logDate: "01-07-2026" }).success).toBe(false);
  });
});
