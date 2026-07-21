import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Env } from "../config/env.validation";
import { ConsoleMailProvider, MAIL_PROVIDER, ResendMailProvider } from "./mail.provider";

@Global()
@Module({
  providers: [
    ResendMailProvider,
    ConsoleMailProvider,
    {
      provide: MAIL_PROVIDER,
      useFactory: (config: ConfigService<Env, true>, resend: ResendMailProvider, dev: ConsoleMailProvider) =>
        config.get("RESEND_API_KEY", { infer: true }) ? resend : dev,
      inject: [ConfigService, ResendMailProvider, ConsoleMailProvider],
    },
  ],
  exports: [MAIL_PROVIDER],
})
export class MailModule {}
