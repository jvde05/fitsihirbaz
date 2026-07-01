import { DietitianSearchInputSchema, UpdateDietitianProfileInputSchema } from "./dietitian";

describe("DietitianSearchInputSchema", () => {
  it("tüm alanlar opsiyonel, varsayılan limit/offset atanır", () => {
    const result = DietitianSearchInputSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
      expect(result.data.offset).toBe(0);
    }
  });

  it("5'ten büyük minRating'i reddeder", () => {
    expect(DietitianSearchInputSchema.safeParse({ minRating: 6 }).success).toBe(false);
  });
});

describe("UpdateDietitianProfileInputSchema", () => {
  it("geçerli güncelleme girdisini kabul eder", () => {
    const result = UpdateDietitianProfileInputSchema.safeParse({
      title: "Uzm. Dyt.",
      specialties: ["Spor Beslenmesi", "Diyabet"],
      yearsOfExperience: 5,
    });
    expect(result.success).toBe(true);
  });

  it("negatif deneyim yılını reddeder", () => {
    const result = UpdateDietitianProfileInputSchema.safeParse({ yearsOfExperience: -1 });
    expect(result.success).toBe(false);
  });
});
