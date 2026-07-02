import type {
  DietitianProfile,
  Order as OrderRow,
  Package as PackageRow,
  Payment as PaymentRow,
  User,
} from "@fit-sihirbaz/db";
import type { MockCheckoutDetails, Payment } from "@fit-sihirbaz/shared";

export function toPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    orderId: row.orderId,
    provider: row.provider,
    status: row.status,
    paidAt: row.paidAt ? row.paidAt.toISOString() : null,
  };
}

type PaymentWithOrderRelations = PaymentRow & {
  order: OrderRow & { package: PackageRow; dietitian: DietitianProfile & { user: User } };
};

export function toMockCheckoutDetails(row: PaymentWithOrderRelations): MockCheckoutDetails {
  return {
    paymentId: row.id,
    packageTitle: row.order.package.title,
    dietitianFirstName: row.order.dietitian.user.firstName,
    dietitianLastName: row.order.dietitian.user.lastName,
    amount: Number(row.order.amount),
    currency: row.order.package.currency,
    status: row.status,
  };
}
