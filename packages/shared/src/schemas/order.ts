import { z } from "zod";

export const OrderStatusSchema = z.enum(["PENDING", "PAID", "CANCELLED", "REFUNDED"]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const OrderSchema = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid(),
  packageId: z.string().uuid(),
  dietitianId: z.string().uuid(),
  packageTitle: z.string(),
  amount: z.number(),
  commissionAmount: z.number(),
  dietitianPayoutAmount: z.number(),
  currency: z.string(),
  status: OrderStatusSchema,
  counterpartFirstName: z.string(),
  counterpartLastName: z.string(),
  createdAt: z.string(),
});
export type Order = z.infer<typeof OrderSchema>;

export const CreateOrderInputSchema = z.object({
  packageId: z.string().uuid(),
});
export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;
