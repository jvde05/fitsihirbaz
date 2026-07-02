import { PaymentsService } from "./payments.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import type { PaymentProvider } from "./payments.provider";
import {
  NotMockPaymentError,
  OrderAccessDeniedError,
  OrderNotFoundError,
  OrderNotPendingError,
  PaymentNotFoundError,
} from "./payments.errors";

function buildOrderRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "order-1",
    clientId: "client-1",
    dietitianId: "dietitian-1",
    packageId: "pkg-1",
    amount: "1000",
    status: "PENDING",
    client: { id: "client-1", userId: "client-user-1" },
    dietitian: { id: "dietitian-1", userId: "dyt-user-1", user: { firstName: "Ayşe", lastName: "Yılmaz" } },
    package: { id: "pkg-1", title: "3 Aylık Takip", currency: "TRY" },
    payment: null,
    ...overrides,
  };
}

function buildPaymentRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "payment-1",
    orderId: "order-1",
    provider: "MOCK",
    status: "INITIATED",
    providerTransactionId: "mock_payment-1",
    paidAt: null,
    order: buildOrderRow(),
    ...overrides,
  };
}

describe("PaymentsService", () => {
  let prisma: {
    order: { findUnique: jest.Mock; update: jest.Mock };
    payment: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    clientDietitianLink: { findFirst: jest.Mock; create: jest.Mock };
    $transaction: jest.Mock;
  };
  let notifications: { create: jest.Mock };
  let provider: { initiateCheckout: jest.Mock };
  let service: PaymentsService;

  beforeEach(() => {
    prisma = {
      order: { findUnique: jest.fn(), update: jest.fn() },
      payment: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      clientDietitianLink: { findFirst: jest.fn(), create: jest.fn() },
      $transaction: jest.fn((callback: (tx: unknown) => unknown) => callback(prisma)),
    };
    notifications = { create: jest.fn() };
    provider = { initiateCheckout: jest.fn() };
    service = new PaymentsService(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationsService,
      provider as unknown as PaymentProvider,
    );
  });

  describe("initiate", () => {
    it("sipariş yoksa OrderNotFoundError fırlatır", async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.initiate("client-user-1", { orderId: "order-1" })).rejects.toBeInstanceOf(
        OrderNotFoundError,
      );
    });

    it("başka danışanın siparişi için OrderAccessDeniedError fırlatır", async () => {
      prisma.order.findUnique.mockResolvedValue(buildOrderRow({ client: { id: "c2", userId: "baska-user" } }));
      await expect(service.initiate("client-user-1", { orderId: "order-1" })).rejects.toBeInstanceOf(
        OrderAccessDeniedError,
      );
    });

    it("PENDING olmayan sipariş için OrderNotPendingError fırlatır", async () => {
      prisma.order.findUnique.mockResolvedValue(buildOrderRow({ status: "PAID" }));
      await expect(service.initiate("client-user-1", { orderId: "order-1" })).rejects.toBeInstanceOf(
        OrderNotPendingError,
      );
    });

    it("ödeme oluşturup provider'dan checkoutUrl alır", async () => {
      prisma.order.findUnique.mockResolvedValue(buildOrderRow());
      prisma.payment.create.mockResolvedValue(buildPaymentRow());
      provider.initiateCheckout.mockResolvedValue({
        checkoutUrl: "http://localhost:3000/danisan/odeme-simulasyon/payment-1",
        providerTransactionId: "mock_payment-1",
      });

      const result = await service.initiate("client-user-1", { orderId: "order-1" });
      expect(result.paymentId).toBe("payment-1");
      expect(result.checkoutUrl).toContain("odeme-simulasyon");
      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { providerTransactionId: "mock_payment-1" } }),
      );
    });

    it("zaten INITIATED bir ödeme varsa yeniden checkoutUrl döner, yeni ödeme oluşturmaz", async () => {
      const existingPayment = buildPaymentRow();
      prisma.order.findUnique.mockResolvedValue(buildOrderRow({ payment: existingPayment }));
      provider.initiateCheckout.mockResolvedValue({
        checkoutUrl: "http://localhost:3000/danisan/odeme-simulasyon/payment-1",
        providerTransactionId: "mock_payment-1",
      });

      const result = await service.initiate("client-user-1", { orderId: "order-1" });
      expect(result.paymentId).toBe("payment-1");
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });
  });

  describe("simulateOutcome", () => {
    it("ödeme yoksa PaymentNotFoundError fırlatır", async () => {
      prisma.payment.findUnique.mockResolvedValue(null);
      await expect(service.simulateOutcome("client-user-1", "payment-1", "SUCCESS")).rejects.toBeInstanceOf(
        PaymentNotFoundError,
      );
    });

    it("mock olmayan provider için NotMockPaymentError fırlatır", async () => {
      prisma.payment.findUnique.mockResolvedValue(buildPaymentRow({ provider: "IYZICO" }));
      await expect(service.simulateOutcome("client-user-1", "payment-1", "SUCCESS")).rejects.toBeInstanceOf(
        NotMockPaymentError,
      );
    });
  });

  describe("applyProviderResult", () => {
    it("SUCCESS durumunda order'ı PAID yapar, link oluşturur ve iki tarafa bildirim gönderir", async () => {
      prisma.payment.findUnique.mockResolvedValue(buildPaymentRow());
      prisma.payment.update.mockResolvedValue(buildPaymentRow({ status: "SUCCESS" }));
      prisma.clientDietitianLink.findFirst.mockResolvedValue(null);

      const result = await service.applyProviderResult("payment-1", "SUCCESS");

      expect(result.status).toBe("SUCCESS");
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "order-1" }, data: { status: "PAID" } }),
      );
      expect(prisma.clientDietitianLink.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ source: "MARKETPLACE", status: "ACTIVE" }) }),
      );
      expect(notifications.create).toHaveBeenCalledWith(
        "client-user-1",
        "ORDER_PAID",
        expect.objectContaining({ orderId: "order-1" }),
      );
      expect(notifications.create).toHaveBeenCalledWith(
        "dyt-user-1",
        "NEW_ORDER",
        expect.objectContaining({ orderId: "order-1" }),
      );
    });

    it("zaten ACTIVE link varsa yeni link oluşturmaz", async () => {
      prisma.payment.findUnique.mockResolvedValue(buildPaymentRow());
      prisma.payment.update.mockResolvedValue(buildPaymentRow({ status: "SUCCESS" }));
      prisma.clientDietitianLink.findFirst.mockResolvedValue({ id: "link-1" });

      await service.applyProviderResult("payment-1", "SUCCESS");
      expect(prisma.clientDietitianLink.create).not.toHaveBeenCalled();
    });

    it("FAILED durumunda bildirim göndermez ve link oluşturmaz", async () => {
      prisma.payment.findUnique.mockResolvedValue(buildPaymentRow());
      prisma.payment.update.mockResolvedValue(buildPaymentRow({ status: "FAILED" }));

      const result = await service.applyProviderResult("payment-1", "FAILED");
      expect(result.status).toBe("FAILED");
      expect(prisma.clientDietitianLink.create).not.toHaveBeenCalled();
      expect(notifications.create).not.toHaveBeenCalled();
    });

    it("zaten SUCCESS olan ödeme için idempotent şekilde no-op yapar (tekrar webhook)", async () => {
      prisma.payment.findUnique.mockResolvedValue(buildPaymentRow({ status: "SUCCESS" }));

      const result = await service.applyProviderResult("payment-1", "SUCCESS");
      expect(result.status).toBe("SUCCESS");
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(notifications.create).not.toHaveBeenCalled();
    });
  });
});
