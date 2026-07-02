import { Injectable } from "@nestjs/common";
import type { CreateOrderInput, Order } from "@fit-sihirbaz/shared";
import { PrismaService } from "../prisma/prisma.service";
import { ClientProfileNotFoundError, DietitianProfileNotFoundError, PackageNotFoundError } from "./orders.errors";
import { toOrder } from "./orders.mapper";

const ORDER_INCLUDE = {
  package: true,
  client: { include: { user: true } },
  dietitian: { include: { user: true } },
} as const;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(clientUserId: string, input: CreateOrderInput): Promise<Order> {
    const clientProfile = await this.prisma.clientProfile.findUnique({ where: { userId: clientUserId } });
    if (!clientProfile) {
      throw new ClientProfileNotFoundError();
    }

    const pkg = await this.prisma.package.findUnique({
      where: { id: input.packageId },
      include: { dietitian: true },
    });
    if (!pkg || !pkg.isActive) {
      throw new PackageNotFoundError();
    }

    const price = Number(pkg.price);
    const commissionRate = Number(pkg.dietitian.commissionRate);
    const commissionAmount = round2(price * commissionRate);
    const dietitianPayoutAmount = round2(price - commissionAmount);

    const order = await this.prisma.order.create({
      data: {
        clientId: clientProfile.id,
        packageId: pkg.id,
        dietitianId: pkg.dietitianId,
        amount: price,
        commissionAmount,
        dietitianPayoutAmount,
        status: "PENDING",
      },
      include: ORDER_INCLUDE,
    });

    return toOrder(order, "CLIENT");
  }

  async listForClient(clientUserId: string): Promise<Order[]> {
    const clientProfile = await this.prisma.clientProfile.findUnique({ where: { userId: clientUserId } });
    if (!clientProfile) {
      throw new ClientProfileNotFoundError();
    }
    const orders = await this.prisma.order.findMany({
      where: { clientId: clientProfile.id },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
    return orders.map((order) => toOrder(order, "CLIENT"));
  }

  async listForDietitian(dietitianUserId: string): Promise<Order[]> {
    const dietitianProfile = await this.prisma.dietitianProfile.findUnique({ where: { userId: dietitianUserId } });
    if (!dietitianProfile) {
      throw new DietitianProfileNotFoundError();
    }
    const orders = await this.prisma.order.findMany({
      where: { dietitianId: dietitianProfile.id },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
    return orders.map((order) => toOrder(order, "DIETITIAN"));
  }
}
