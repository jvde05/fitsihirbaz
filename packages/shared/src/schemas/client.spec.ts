import { LinkToDietitianInputSchema, UpdateClientProfileInputSchema } from "./client";

describe("LinkToDietitianInputSchema", () => {
  it("geçerli e-postayı kabul eder", () => {
    expect(LinkToDietitianInputSchema.safeParse({ clientEmail: "test@example.com" }).success).toBe(true);
  });

  it("geçersiz e-postayı reddeder", () => {
    expect(LinkToDietitianInputSchema.safeParse({ clientEmail: "not-an-email" }).success).toBe(false);
  });
});

describe("UpdateClientProfileInputSchema", () => {
  it("geçerli tarih formatını kabul eder", () => {
    const result = UpdateClientProfileInputSchema.safeParse({ birthDate: "1990-05-20" });
    expect(result.success).toBe(true);
  });

  it("geçersiz tarih formatını reddeder", () => {
    const result = UpdateClientProfileInputSchema.safeParse({ birthDate: "20/05/1990" });
    expect(result.success).toBe(false);
  });

  it("300 cm'den uzun boyu reddeder", () => {
    const result = UpdateClientProfileInputSchema.safeParse({ heightCm: 350 });
    expect(result.success).toBe(false);
  });

  it("boş string enum alanlarını (doldurulmamış select) kabul eder", () => {
    const result = UpdateClientProfileInputSchema.safeParse({
      gender: "",
      goal: "",
      activityLevel: "",
      heightCm: 168,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gender).toBeUndefined();
      expect(result.data.goal).toBeUndefined();
      expect(result.data.activityLevel).toBeUndefined();
    }
  });
});
