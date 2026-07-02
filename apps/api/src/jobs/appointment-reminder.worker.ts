import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import type { Env } from "../config/env.validation";
import { APPOINTMENT_REMINDER_QUEUE_NAME, type AppointmentReminderJobData } from "./appointment-reminder.queue";

@Injectable()
export class AppointmentReminderWorker implements OnModuleInit, OnModuleDestroy {
  private worker?: Worker<AppointmentReminderJobData>;

  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit(): void {
    const connection = new IORedis(this.config.get("REDIS_URL", { infer: true }), { maxRetriesPerRequest: null });
    this.worker = new Worker<AppointmentReminderJobData>(
      APPOINTMENT_REMINDER_QUEUE_NAME,
      (job: Job<AppointmentReminderJobData>) => this.processJob(job.data.appointmentId),
      { connection },
    );
  }

  private async processJob(appointmentId: string): Promise<void> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { client: true, dietitian: true },
    });
    // Randevu bu arada iptal edilmiş/durumu değişmiş olabilir; sadece hâlâ
    // SCHEDULED olan randevular için hatırlatma gönderilir.
    if (!appointment || appointment.status !== "SCHEDULED") {
      return;
    }

    const payload = { appointmentId: appointment.id, scheduledAt: appointment.scheduledAt.toISOString() };
    await this.notifications.create(appointment.client.userId, "APPOINTMENT_REMINDER", payload);
    await this.notifications.create(appointment.dietitian.userId, "APPOINTMENT_REMINDER", payload);
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
