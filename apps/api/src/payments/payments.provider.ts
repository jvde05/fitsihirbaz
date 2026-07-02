import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Order, Package, Payment } from "@fit-sihirbaz/db";
import type { Env } from "../config/env.validation";

export interface InitiateCheckoutResult {
  checkoutUrl: string;
  providerTransactionId: string;
}

// Gerçek bir sağlayıcıya (iyzico/PayTR) geçilecekse bu interface'in yeni bir
// implementasyonu yazılıp PAYMENT_PROVIDER token'ında MockPaymentProvider yerine
// bağlanır; PaymentsService'teki state machine değişmez.
export interface PaymentProvider {
  initiateCheckout(payment: Payment, order: Order, pkg: Package): Promise<InitiateCheckoutResult>;
}

export const PAYMENT_PROVIDER = Symbol("PAYMENT_PROVIDER");

// Gerçek bir ödeme sağlayıcısının yerini tutan mock implementasyon: hosted checkout
// sayfası yerine kendi web uygulamamızdaki bir simülasyon sayfasına yönlendirir.
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  constructor(private readonly config: ConfigService<Env, true>) {}

  async initiateCheckout(payment: Payment): Promise<InitiateCheckoutResult> {
    const webAppUrl = this.config.get("WEB_APP_URL", { infer: true });
    return {
      checkoutUrl: `${webAppUrl}/danisan/odeme-simulasyon/${payment.id}`,
      providerTransactionId: `mock_${payment.id}`,
    };
  }
}
