import type {
  ClientProfile,
  DietitianProfile,
  Order as OrderRow,
  Package as PackageRow,
  User,
} from "@fit-sihirbaz/db";
import type { Order, Role } from "@fit-sihirbaz/shared";

type OrderWithRelations = OrderRow & {
  package: PackageRow;
  client: ClientProfile & { user: User };
  dietitian: DietitianProfile & { user: User };
};

export function toOrder(row: OrderWithRelations, viewerRole: Role): Order {
  const counterpartUser = viewerRole === "CLIENT" ? row.dietitian.user : row.client.user;
  return {
    id: row.id,
    clientId: row.clientId,
    packageId: row.packageId,
    dietitianId: row.dietitianId,
    packageTitle: row.package.title,
    amount: Number(row.amount),
    commissionAmount: Number(row.commissionAmount),
    dietitianPayoutAmount: Number(row.dietitianPayoutAmount),
    currency: row.package.currency,
    status: row.status,
    counterpartFirstName: counterpartUser.firstName,
    counterpartLastName: counterpartUser.lastName,
    createdAt: row.createdAt.toISOString(),
  };
}
