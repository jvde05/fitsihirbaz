import { Module } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { PaymentsWebhookController } from "./payments.controller";
import { MockPaymentProvider, PAYMENT_PROVIDER } from "./payments.provider";

@Module({
  controllers: [PaymentsWebhookController],
  providers: [PaymentsService, { provide: PAYMENT_PROVIDER, useClass: MockPaymentProvider }],
  exports: [PaymentsService],
})
export class PaymentsModule {}
