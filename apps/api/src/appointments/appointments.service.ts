import { Injectable } from "@nestjs/common";
import type { Appointment, CreateAppointmentInput, UpdateAppointmentStatusInput } from "@fit-sihirbaz/shared";
import { PrismaService } from "../prisma/prisma.service";
import {
  AppointmentAccessDeniedError,
  AppointmentNotFoundError,
  ClientNotLinkedError,
  ClientProfileNotFoundError,
  DietitianProfileNotFoundError,
} from "./appointments.errors";
import { toAppointment } from "./appointments.mapper";

const APPOINTMENT_INCLUDE = {
  client: { include: { user: true } },
  dietitian: { include: { user: true } },
} as const;

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(clientUserId: string, input: CreateAppointmentInput): Promise<Appointment> {
    const clientProfile = await this.prisma.clientProfile.findUnique({ where: { userId: clientUserId } });
    if (!clientProfile) {
      throw new ClientProfileNotFoundError();
    }

    const link = await this.prisma.clientDietitianLink.findFirst({
      where: { clientId: clientProfile.id, dietitianId: input.dietitianId, status: "ACTIVE" },
    });
    if (!link) {
      throw new ClientNotLinkedError();
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        clientId: clientProfile.id,
        dietitianId: input.dietitianId,
        scheduledAt: new Date(input.scheduledAt),
        durationMinutes: input.durationMinutes ?? 30,
        meetingLink: input.meetingLink,
        status: "SCHEDULED",
      },
      include: APPOINTMENT_INCLUDE,
    });
    return toAppointment(appointment, "CLIENT");
  }

  async updateStatus(dietitianUserId: string, input: UpdateAppointmentStatusInput): Promise<Appointment> {
    const dietitianProfile = await this.getOwnDietitianProfile(dietitianUserId);
    const existing = await this.prisma.appointment.findUnique({ where: { id: input.id } });
    if (!existing) {
      throw new AppointmentNotFoundError();
    }
    if (existing.dietitianId !== dietitianProfile.id) {
      throw new AppointmentAccessDeniedError();
    }

    const appointment = await this.prisma.appointment.update({
      where: { id: input.id },
      data: { status: input.status },
      include: APPOINTMENT_INCLUDE,
    });
    return toAppointment(appointment, "DIETITIAN");
  }

  async cancel(userId: string, role: "CLIENT" | "DIETITIAN", appointmentId: string): Promise<Appointment> {
    const existing = await this.prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!existing) {
      throw new AppointmentNotFoundError();
    }

    if (role === "CLIENT") {
      const profile = await this.prisma.clientProfile.findUnique({ where: { userId } });
      if (!profile || existing.clientId !== profile.id) {
        throw new AppointmentAccessDeniedError();
      }
    } else {
      const profile = await this.prisma.dietitianProfile.findUnique({ where: { userId } });
      if (!profile || existing.dietitianId !== profile.id) {
        throw new AppointmentAccessDeniedError();
      }
    }

    const appointment = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "CANCELLED" },
      include: APPOINTMENT_INCLUDE,
    });
    return toAppointment(appointment, role);
  }

  async listForClient(clientUserId: string): Promise<Appointment[]> {
    const clientProfile = await this.prisma.clientProfile.findUnique({ where: { userId: clientUserId } });
    if (!clientProfile) {
      throw new ClientProfileNotFoundError();
    }
    const appointments = await this.prisma.appointment.findMany({
      where: { clientId: clientProfile.id },
      include: APPOINTMENT_INCLUDE,
      orderBy: { scheduledAt: "desc" },
    });
    return appointments.map((appointment) => toAppointment(appointment, "CLIENT"));
  }

  async listForDietitian(dietitianUserId: string): Promise<Appointment[]> {
    const dietitianProfile = await this.getOwnDietitianProfile(dietitianUserId);
    const appointments = await this.prisma.appointment.findMany({
      where: { dietitianId: dietitianProfile.id },
      include: APPOINTMENT_INCLUDE,
      orderBy: { scheduledAt: "desc" },
    });
    return appointments.map((appointment) => toAppointment(appointment, "DIETITIAN"));
  }

  private async getOwnDietitianProfile(userId: string) {
    const profile = await this.prisma.dietitianProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new DietitianProfileNotFoundError();
    }
    return profile;
  }
}
