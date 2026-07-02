import { z } from "zod";

export const PaymentProviderSchema = z.enum(["MOCK", "IYZICO", "PAYTR"]);
export type PaymentProvider = z.infer<typeof PaymentProviderSchema>;

export const PaymentStatusSchema = z.enum(["INITIATED", "SUCCESS", "FAILED", "REFUNDED"]);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const PaymentSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  provider: PaymentProviderSchema,
  status: PaymentStatusSchema,
  paidAt: z.string().nullable(),
});
export type Payment = z.infer<typeof PaymentSchema>;

export const InitiatePaymentInputSchema = z.object({
  orderId: z.string().uuid(),
});
export type InitiatePaymentInput = z.infer<typeof InitiatePaymentInputSchema>;

export const InitiatePaymentResultSchema = z.object({
  paymentId: z.string().uuid(),
  checkoutUrl: z.string().url(),
});
export type InitiatePaymentResult = z.infer<typeof InitiatePaymentResultSchema>;

// Mock ödeme simülasyon sayfasının göstereceği özet bilgi.
export const MockCheckoutDetailsSchema = z.object({
  paymentId: z.string().uuid(),
  packageTitle: z.string(),
  dietitianFirstName: z.string(),
  dietitianLastName: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: PaymentStatusSchema,
});
export type MockCheckoutDetails = z.infer<typeof MockCheckoutDetailsSchema>;

export const PaymentOutcomeSchema = z.enum(["SUCCESS", "FAILED"]);
export type PaymentOutcome = z.infer<typeof PaymentOutcomeSchema>;

export const SimulatePaymentOutcomeInputSchema = z.object({
  paymentId: z.string().uuid(),
  outcome: PaymentOutcomeSchema,
});
export type SimulatePaymentOutcomeInput = z.infer<typeof SimulatePaymentOutcomeInputSchema>;
