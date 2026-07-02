import { AdminListUsersInputSchema, AdminSetUserActiveInputSchema } from "./user";

describe("AdminListUsersInputSchema", () => {
  it("filtre olmadan varsayılan limit/offset ile çalışır", () => {
    const result = AdminListUsersInputSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
    }
  });

  it("geçersiz rolü reddeder", () => {
    expect(AdminListUsersInputSchema.safeParse({ role: "SUPERADMIN" }).success).toBe(false);
  });
});

describe("AdminSetUserActiveInputSchema", () => {
  it("geçerli girdiyi kabul eder", () => {
    const result = AdminSetUserActiveInputSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      isActive: false,
    });
    expect(result.success).toBe(true);
  });
});
