import { Inject, Injectable } from "@nestjs/common";
import type {
  InitiatePaymentInput,
  InitiatePaymentResult,
  MockCheckoutDetails,
  Payment,
  PaymentOutcome,
} from "@fit-sihirbaz/shared";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PAYMENT_PROVIDER, type PaymentProvider } from "./payments.provider";
import {
  NotMockPaymentError,
  OrderAccessDeniedError,
  OrderNotFoundError,
  OrderNotPendingError,
  PaymentNotFoundError,
} from "./payments.errors";
import { toMockCheckoutDetails, toPayment } from "./payments.mapper";

const ORDER_INCLUDE = {
  client: true,
  package: true,
  dietitian: { include: { user: true } },
} as const;

const PAYMENT_WITH_ORDER_INCLUDE = {
  order: { include: ORDER_INCLUDE },
} as const;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: PaymentProvider,
  ) {}

  async initiate(clientUserId: string, input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
      include: { ...ORDER_INCLUDE, payment: true },
    });
    if (!order) {
      throw new OrderNotFoundError();
    }
    if (order.client.userId !== clientUserId) {
      throw new OrderAccessDeniedError();
    }
    if (order.status !== "PENDING") {
      throw new OrderNotPendingError();
    }

    if (order.payment) {
      if (order.payment.status !== "INITIATED") {
        throw new OrderNotPendingError();
      }
      const { checkoutUrl } = await this.paymentProvider.initiateCheckout(order.payment, order, order.package);
      return { paymentId: order.payment.id, checkoutUrl };
    }

    const payment = await this.prisma.payment.create({
      data: { orderId: order.id, provider: "MOCK", status: "INITIATED", providerTransactionId: "" },
    });
    const { checkoutUrl, providerTransactionId } = await this.paymentProvider.initiateCheckout(
      payment,
      order,
      order.package,
    );
    await this.prisma.payment.update({ where: { id: payment.id }, data: { providerTransactionId } });

    return { paymentId: payment.id, checkoutUrl };
  }

  async getMockCheckoutDetails(clientUserId: string, paymentId: string): Promise<MockCheckoutDetails> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: PAYMENT_WITH_ORDER_INCLUDE,
    });
    if (!payment) {
      throw new PaymentNotFoundError();
    }
    if (payment.order.client.userId !== clientUserId) {
      throw new OrderAccessDeniedError();
    }
    return toMockCheckoutDetails(payment);
  }

  async simulateOutcome(clientUserId: string, paymentId: string, outcome: PaymentOutcome): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: PAYMENT_WITH_ORDER_INCLUDE,
    });
    if (!payment) {
      throw new PaymentNotFoundError();
    }
    if (payment.order.client.userId !== clientUserId) {
      throw new OrderAccessDeniedError();
    }
    if (payment.provider !== "MOCK") {
      throw new NotMockPaymentError();
    }
    return this.applyProviderResult(paymentId, outcome);
  }

  // REST webhook ve simulateOutcome'un ortak çekirdeği — provider=MOCK dışındaki
  // sağlayıcılardan gelecek gerçek webhook'lar da bu metodu çağıracak. Idempotent:
  // payment zaten INITIATED değilse (webhook tekrar gönderilmiş olabilir) no-op.
  async applyProviderResult(paymentId: string, outcome: PaymentOutcome): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: PAYMENT_WITH_ORDER_INCLUDE,
    });
    if (!payment) {
      throw new PaymentNotFoundError();
    }
    if (payment.status !== "INITIATED") {
      return toPayment(payment);
    }

    const { order } = payment;
    const updatedPayment = await this.prisma.$transaction(async (tx) => {
      const nextPayment = await tx.payment.update({
        where: { id: paymentId },
        data: { status: outcome, paidAt: outcome === "SUCCESS" ? new Date() : null },
      });

      if (outcome === "SUCCESS") {
        await tx.order.update({ where: { id: order.id }, data: { status: "PAID" } });

        const existingLink = await tx.clientDietitianLink.findFirst({
          where: { clientId: order.clientId, dietitianId: order.dietitianId, status: "ACTIVE" },
        });
        if (!existingLink) {
          await tx.clientDietitianLink.create({
            data: {
              clientId: order.clientId,
              dietitianId: order.dietitianId,
              status: "ACTIVE",
              startedAt: new Date(),
              source: "MARKETPLACE",
            },
          });
        }
      }

      return nextPayment;
    });

    if (outcome === "SUCCESS") {
      await this.notifications.create(order.client.userId, "ORDER_PAID", {
        orderId: order.id,
        packageTitle: order.package.title,
      });
      await this.notifications.create(order.dietitian.userId, "NEW_ORDER", {
        orderId: order.id,
        packageTitle: order.package.title,
        amount: Number(order.amount),
      });
    }

    return toPayment(updatedPayment);
  }
}
