import { CreateOrderInputSchema } from "./order";

describe("CreateOrderInputSchema", () => {
  it("geçerli uuid'yi kabul eder", () => {
    const result = CreateOrderInputSchema.safeParse({ packageId: "123e4567-e89b-12d3-a456-426614174000" });
    expect(result.success).toBe(true);
  });

  it("geçersiz uuid'yi reddeder", () => {
    const result = CreateOrderInputSchema.safeParse({ packageId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });
});
