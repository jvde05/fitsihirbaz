import { InitiatePaymentInputSchema, SimulatePaymentOutcomeInputSchema } from "./payment";

describe("InitiatePaymentInputSchema", () => {
  it("geçerli orderId'yi kabul eder", () => {
    const result = InitiatePaymentInputSchema.safeParse({ orderId: "123e4567-e89b-12d3-a456-426614174000" });
    expect(result.success).toBe(true);
  });
});

describe("SimulatePaymentOutcomeInputSchema", () => {
  it("SUCCESS/FAILED dışındaki outcome'u reddeder", () => {
    const result = SimulatePaymentOutcomeInputSchema.safeParse({
      paymentId: "123e4567-e89b-12d3-a456-426614174000",
      outcome: "PENDING",
    });
    expect(result.success).toBe(false);
  });

  it("geçerli SUCCESS outcome'u kabul eder", () => {
    const result = SimulatePaymentOutcomeInputSchema.safeParse({
      paymentId: "123e4567-e89b-12d3-a456-426614174000",
      outcome: "SUCCESS",
    });
    expect(result.success).toBe(true);
  });
});
