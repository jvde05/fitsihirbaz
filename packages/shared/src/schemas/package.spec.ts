import { BrowsePackagesInputSchema, CreatePackageInputSchema, UpdatePackageInputSchema } from "./package";

describe("CreatePackageInputSchema", () => {
  const validInput = {
    title: "3 Aylık Online Takip",
    durationDays: 90,
    price: 1500,
  };

  it("geçerli girdiyi kabul eder, currency varsayılan TRY olur", () => {
    const result = CreatePackageInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe("TRY");
    }
  });

  it("negatif fiyatı reddeder", () => {
    expect(CreatePackageInputSchema.safeParse({ ...validInput, price: -10 }).success).toBe(false);
  });

  it("sıfır günlük süreyi reddeder", () => {
    expect(CreatePackageInputSchema.safeParse({ ...validInput, durationDays: 0 }).success).toBe(false);
  });
});

describe("UpdatePackageInputSchema", () => {
  it("yalnızca isActive alanının güncellenmesine izin verir", () => {
    const result = UpdatePackageInputSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      isActive: false,
    });
    expect(result.success).toBe(true);
  });
});

describe("BrowsePackagesInputSchema", () => {
  it("filtre olmadan varsayılan limit/offset ile çalışır", () => {
    const result = BrowsePackagesInputSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });
});
