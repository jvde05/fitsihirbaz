import { Global, Module } from "@nestjs/common";
import { AppointmentReminderQueue } from "./appointment-reminder.queue";
import { AppointmentReminderWorker } from "./appointment-reminder.worker";

@Global()
@Module({
  providers: [AppointmentReminderQueue, AppointmentReminderWorker],
  exports: [AppointmentReminderQueue],
})
export class JobsModule {}
